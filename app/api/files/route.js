import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getBucket() {
  const { env } = getCloudflareContext();
  if (!env.CLOUD_FILES) throw new Error("Der Webflow-Cloud-Dokumentenspeicher CLOUD_FILES ist nicht verbunden.");
  return env.CLOUD_FILES;
}

function safePart(value = "") {
  return value.toString().normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "datei";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Keine gültige Datei empfangen." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "Dateien dürfen höchstens 20 MB groß sein." }, { status: 413 });

    const companyId = safePart(formData.get("companyId") || "allgemein");
    const projectId = safePart(formData.get("projectId") || "ohne-projekt");
    const filename = safePart(file.name);
    const key = `${companyId}/${projectId}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
    const bucket = getBucket();
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
      },
      customMetadata: {
        originalName: file.name,
        companyId,
        projectId
      }
    });

    return Response.json({
      key,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("File upload failed", error);
    return Response.json({ error: error.message || "Datei konnte nicht gespeichert werden." }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return new Response("Dateischlüssel fehlt.", { status: 400 });
    const object = await getBucket().get(key);
    if (!object) return new Response("Datei nicht gefunden.", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    if (!headers.has("Content-Disposition")) {
      const name = object.customMetadata?.originalName || key.split("/").pop() || "download";
      headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
    }
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("File download failed", error);
    return new Response(error.message || "Datei konnte nicht geladen werden.", { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return Response.json({ error: "Dateischlüssel fehlt." }, { status: 400 });
    await getBucket().delete(key);
    return Response.json({ deleted: true });
  } catch (error) {
    console.error("File delete failed", error);
    return Response.json({ error: error.message || "Datei konnte nicht gelöscht werden." }, { status: 500 });
  }
}
