import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createSeedState } from "@/data/seed-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_ID = "main";
const MAX_STATE_BYTES = 1_800_000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function getDb() {
  const { env } = getCloudflareContext();
  if (!env?.DB) {
    const error = new Error("Die Webflow-Cloud-SQLite-Bindung DB ist nicht verbunden. Prüfen Sie in Webflow Cloud unter Environment → Storage, ob DB angelegt wurde, und deployen Sie danach erneut.");
    error.code = "DB_BINDING_MISSING";
    throw error;
  }
  return env.DB;
}

async function ensureSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      revision INTEGER NOT NULL,
      actor_user_id TEXT,
      event TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function validateState(state) {
  if (!state || typeof state !== "object") return false;
  return ["companies", "users", "projects", "messages", "documents", "callbacks"]
    .every((key) => Array.isArray(state[key]));
}

async function getOrCreateState(db) {
  await ensureSchema(db);
  let row = await db.prepare("SELECT data, revision, updated_at FROM app_state WHERE id = ?")
    .bind(STATE_ID)
    .first();
  if (!row) {
    const now = new Date().toISOString();
    const seed = createSeedState();
    await db.prepare("INSERT INTO app_state (id, data, revision, updated_at) VALUES (?, ?, ?, ?)")
      .bind(STATE_ID, JSON.stringify(seed), 1, now)
      .run();
    row = { data: JSON.stringify(seed), revision: 1, updated_at: now };
  }
  return row;
}

export async function GET() {
  try {
    const db = getDb();
    const row = await getOrCreateState(db);
    return json({
      state: JSON.parse(row.data),
      revision: Number(row.revision),
      updatedAt: row.updated_at,
      storage: "webflow-sqlite"
    });
  } catch (error) {
    console.error("Shared state GET failed", error);
    return json({ error: error.message || "Gemeinsame Daten konnten nicht geladen werden.", code: error.code || "STATE_READ_FAILED" }, 500);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!validateState(body.state)) return json({ error: "Ungültiger Datenstand." }, 400);
    const serialized = JSON.stringify(body.state);
    if (new TextEncoder().encode(serialized).byteLength > MAX_STATE_BYTES) {
      return json({ error: "Der gemeinsame Datenstand nähert sich der Datenbankgrenze. Bitte große Dateien ausschließlich über den Dokumenten-Upload speichern." }, 413);
    }

    const db = getDb();
    const current = await getOrCreateState(db);
    const expectedRevision = Number(body.revision);
    const currentRevision = Number(current.revision);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== currentRevision) {
      return json({
        error: "Die Daten wurden zwischenzeitlich auf einem anderen Gerät geändert.",
        conflict: true,
        state: JSON.parse(current.data),
        revision: currentRevision,
        updatedAt: current.updated_at
      }, 409);
    }

    const nextRevision = currentRevision + 1;
    const now = new Date().toISOString();
    const result = await db.prepare(
      "UPDATE app_state SET data = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?"
    ).bind(serialized, nextRevision, now, STATE_ID, currentRevision).run();

    if (!result.success || Number(result.meta?.changes || 0) !== 1) {
      const latest = await getOrCreateState(db);
      return json({
        error: "Die Daten wurden gleichzeitig geändert.",
        conflict: true,
        state: JSON.parse(latest.data),
        revision: Number(latest.revision),
        updatedAt: latest.updated_at
      }, 409);
    }

    await db.prepare(
      "INSERT INTO sync_audit (revision, actor_user_id, event, created_at) VALUES (?, ?, ?, ?)"
    ).bind(nextRevision, body.actorUserId || null, String(body.event || "Daten aktualisiert").slice(0, 500), now).run();

    return json({ revision: nextRevision, updatedAt: now, storage: "webflow-sqlite" });
  } catch (error) {
    console.error("Shared state PUT failed", error);
    return json({ error: error.message || "Gemeinsame Daten konnten nicht gespeichert werden.", code: error.code || "STATE_WRITE_FAILED" }, 500);
  }
}

export async function DELETE() {
  try {
    const db = getDb();
    await ensureSchema(db);
    const current = await getOrCreateState(db);
    const seed = createSeedState();
    const now = new Date().toISOString();
    const nextRevision = Number(current.revision || 0) + 1;
    await db.prepare(`
      INSERT INTO app_state (id, data, revision, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, revision = excluded.revision, updated_at = excluded.updated_at
    `).bind(STATE_ID, JSON.stringify(seed), nextRevision, now).run();
    await db.prepare("INSERT INTO sync_audit (revision, actor_user_id, event, created_at) VALUES (?, ?, ?, ?)")
      .bind(nextRevision, null, "Gemeinsame Demo zurückgesetzt", now).run();
    return json({ state: seed, revision: nextRevision, updatedAt: now });
  } catch (error) {
    console.error("Shared state reset failed", error);
    return json({ error: error.message || "Gemeinsame Demo konnte nicht zurückgesetzt werden.", code: error.code || "STATE_RESET_FAILED" }, 500);
  }
}
