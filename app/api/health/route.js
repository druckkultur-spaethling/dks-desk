import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function response(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Surrogate-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}

export async function GET(request) {
  try {
    const { env } = getCloudflareContext();
    const hasDb = Boolean(env?.DB);
    const hasFiles = Boolean(env?.CLOUD_FILES);

    if (!hasDb) {
      return response({
        ok: false,
        code: "DB_BINDING_MISSING",
        database: false,
        files: hasFiles,
        error: "Die Webflow-Cloud-SQLite-Bindung DB fehlt. Öffnen Sie die Environment, prüfen Sie Storage und deployen Sie danach erneut."
      }, 503);
    }

    const db = typeof env.DB.withSession === "function" ? env.DB.withSession("first-primary") : env.DB;
    await db.batch([
      db.prepare("CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)"),
      db.prepare("CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)")
    ]);
    const generated = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.prepare("INSERT OR IGNORE INTO app_meta (key, value, updated_at) VALUES ('instance_id', ?, ?)").bind(generated, now).run();
    const stateRow = await db.prepare("SELECT revision, updated_at FROM app_state WHERE id = 'main'").first();
    const instanceRow = await db.prepare("SELECT value FROM app_meta WHERE key = 'instance_id'").first();

    const requestUrl = new URL(request.url);
    return response({
      ok: true,
      database: true,
      files: hasFiles,
      revision: Number(stateRow?.revision || 0),
      updatedAt: stateRow?.updated_at || null,
      instanceId: instanceRow?.value || generated,
      storage: "webflow-sqlite-primary",
      timestamp: now,
      apiHost: requestUrl.host,
      apiBase: requestUrl.pathname.replace(/\/api\/health\/?$/, "") || ""
    });
  } catch (error) {
    console.error("Portal health check failed", error);
    return response({
      ok: false,
      code: "STORAGE_UNAVAILABLE",
      error: error.message || "Die zentrale Webflow-Cloud-Speicherung ist nicht erreichbar."
    }, 503);
  }
}
