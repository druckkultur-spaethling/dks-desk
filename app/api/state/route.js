import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createSeedState } from "@/data/seed-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATE_ID = "main";
const INSTANCE_KEY = "instance_id";
const MAX_STATE_BYTES = 1_800_000;

function apiMeta(request) {
  const url = new URL(request.url);
  return {
    apiHost: url.host,
    apiBase: url.pathname.replace(/\/api\/state\/?$/, "") || ""
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Surrogate-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
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

function primarySession(db) {
  // D1 Sessions sorgen dafür, dass jeder Abruf auf einem Datenstand beginnt,
  // der mindestens so aktuell wie die Primärdatenbank ist. Der Fallback hält
  // die Route auch in Umgebungen ohne Sessions API funktionsfähig.
  return typeof db.withSession === "function" ? db.withSession("first-primary") : db;
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(
      "CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)"
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS sync_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, revision INTEGER NOT NULL, actor_user_id TEXT, event TEXT, created_at TEXT NOT NULL)"
    ),
    db.prepare(
      "CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)"
    )
  ]);
}

function validateState(state) {
  if (!state || typeof state !== "object") return false;
  return ["companies", "users", "projects", "messages", "documents", "callbacks"]
    .every((key) => Array.isArray(state[key]));
}

async function getInstanceId(db) {
  const now = new Date().toISOString();
  const generated = crypto.randomUUID();
  await db.prepare(
    "INSERT OR IGNORE INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)"
  ).bind(INSTANCE_KEY, generated, now).run();
  const row = await db.prepare("SELECT value FROM app_meta WHERE key = ?")
    .bind(INSTANCE_KEY)
    .first();
  return String(row?.value || generated);
}

async function getOrCreateState(db) {
  await ensureSchema(db);
  let row = await db.prepare("SELECT data, revision, updated_at FROM app_state WHERE id = ?")
    .bind(STATE_ID)
    .first();
  if (!row) {
    const now = new Date().toISOString();
    const seed = createSeedState();
    await db.prepare("INSERT OR IGNORE INTO app_state (id, data, revision, updated_at) VALUES (?, ?, ?, ?)")
      .bind(STATE_ID, JSON.stringify(seed), 1, now)
      .run();
    row = await db.prepare("SELECT data, revision, updated_at FROM app_state WHERE id = ?")
      .bind(STATE_ID)
      .first();
  }
  return row;
}

function bookmarkHeaders(session) {
  const bookmark = typeof session.getBookmark === "function" ? session.getBookmark() : "";
  return bookmark ? { "X-D1-Bookmark": bookmark } : {};
}

export async function GET(request) {
  try {
    const db = getDb();
    const session = primarySession(db);
    const row = await getOrCreateState(session);
    const instanceId = await getInstanceId(session);
    return json({
      state: JSON.parse(row.data),
      revision: Number(row.revision),
      updatedAt: row.updated_at,
      instanceId,
      storage: "webflow-sqlite-primary",
      ...apiMeta(request)
    }, 200, bookmarkHeaders(session));
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
    const session = primarySession(db);
    const current = await getOrCreateState(session);
    const instanceId = await getInstanceId(session);
    const expectedRevision = Number(body.revision);
    const currentRevision = Number(current.revision);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== currentRevision) {
      return json({
        error: "Die Daten wurden zwischenzeitlich auf einem anderen Gerät geändert.",
        conflict: true,
        state: JSON.parse(current.data),
        revision: currentRevision,
        updatedAt: current.updated_at,
        instanceId,
        ...apiMeta(request)
      }, 409, bookmarkHeaders(session));
    }

    const nextRevision = currentRevision + 1;
    const now = new Date().toISOString();
    const result = await session.prepare(
      "UPDATE app_state SET data = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?"
    ).bind(serialized, nextRevision, now, STATE_ID, currentRevision).run();

    if (!result.success || Number(result.meta?.changes || 0) !== 1) {
      const latest = await getOrCreateState(session);
      return json({
        error: "Die Daten wurden gleichzeitig geändert.",
        conflict: true,
        state: JSON.parse(latest.data),
        revision: Number(latest.revision),
        updatedAt: latest.updated_at,
        instanceId,
        ...apiMeta(request)
      }, 409, bookmarkHeaders(session));
    }

    await session.prepare(
      "INSERT INTO sync_audit (revision, actor_user_id, event, created_at) VALUES (?, ?, ?, ?)"
    ).bind(nextRevision, body.actorUserId || null, String(body.event || "Daten aktualisiert").slice(0, 500), now).run();

    // Der Schreibvorgang wird noch innerhalb derselben sequenziell konsistenten
    // Session zurückgelesen. Erst dann meldet die API einen erfolgreichen Save.
    const verified = await session.prepare("SELECT revision, updated_at FROM app_state WHERE id = ?")
      .bind(STATE_ID)
      .first();
    if (Number(verified?.revision || 0) < nextRevision) {
      return json({ error: "Die Änderung wurde geschrieben, konnte aber nicht bestätigt werden.", code: "WRITE_VERIFY_FAILED" }, 503, bookmarkHeaders(session));
    }

    return json({
      revision: Number(verified.revision),
      updatedAt: verified.updated_at || now,
      instanceId,
      storage: "webflow-sqlite-primary",
      ...apiMeta(request)
    }, 200, bookmarkHeaders(session));
  } catch (error) {
    console.error("Shared state PUT failed", error);
    return json({ error: error.message || "Gemeinsame Daten konnten nicht gespeichert werden.", code: error.code || "STATE_WRITE_FAILED" }, 500);
  }
}

export async function DELETE(request) {
  try {
    const db = getDb();
    const session = primarySession(db);
    await ensureSchema(session);
    const current = await getOrCreateState(session);
    const instanceId = await getInstanceId(session);
    const seed = createSeedState();
    const now = new Date().toISOString();
    const nextRevision = Number(current.revision || 0) + 1;
    await session.prepare(
      "INSERT INTO app_state (id, data, revision, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, revision = excluded.revision, updated_at = excluded.updated_at"
    ).bind(STATE_ID, JSON.stringify(seed), nextRevision, now).run();
    await session.prepare("INSERT INTO sync_audit (revision, actor_user_id, event, created_at) VALUES (?, ?, ?, ?)")
      .bind(nextRevision, null, "Gemeinsame Demo zurückgesetzt", now).run();
    return json({ state: seed, revision: nextRevision, updatedAt: now, instanceId, ...apiMeta(request) }, 200, bookmarkHeaders(session));
  } catch (error) {
    console.error("Shared state reset failed", error);
    return json({ error: error.message || "Gemeinsame Demo konnte nicht zurückgesetzt werden.", code: error.code || "STATE_RESET_FAILED" }, 500);
  }
}
