import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const hasDb = Boolean(env?.DB);
    const hasFiles = Boolean(env?.CLOUD_FILES);

    if (!hasDb) {
      return Response.json({
        ok: false,
        code: "DB_BINDING_MISSING",
        database: false,
        files: hasFiles,
        error: "Die Webflow-Cloud-SQLite-Bindung DB fehlt. Öffnen Sie die Environment, prüfen Sie Storage und deployen Sie danach erneut."
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    await env.DB.prepare("SELECT 1 AS ok").first();

    return Response.json({
      ok: true,
      database: true,
      files: hasFiles,
      timestamp: new Date().toISOString()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Portal health check failed", error);
    return Response.json({
      ok: false,
      code: "STORAGE_UNAVAILABLE",
      error: error.message || "Die zentrale Webflow-Cloud-Speicherung ist nicht erreichbar."
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
