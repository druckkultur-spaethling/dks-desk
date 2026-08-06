export const runtime = "edge";

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

function demoResult(fileName, company) {
  const base = fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
  return {
    kind: /falt|verpack|karton/i.test(base) ? "Faltschachtel / Verpackung" : "Printprodukt",
    title: base && !/^bestellung$/i.test(base) ? base : "Faltschachtel Vitamin-Komplex",
    description: `Bestellung von ${company || "Kundenseite"}. Bitte Ausführung, Lieferadresse und Druckdaten persönlich prüfen.`,
    quantity: "25.000 Stück",
    deadline: "2026-09-15",
    customerOrderNumber: "PO-2026-1845",
    format: "59 × 59 × 110 mm",
    material: "GC1 350 g/m²"
  };
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n");
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const company = String(formData.get("company") || "");

    if (!(file instanceof File)) {
      return Response.json({ error: "Es wurde keine PDF-Datei übertragen." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return Response.json({ error: "Die PDF ist größer als 8 MB." }, { status: 413 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ mode: "demo", data: demoResult(file.name, company) });
    }

    const base64 = arrayBufferToBase64(await file.arrayBuffer());
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        quantity: { type: "string" },
        deadline: { type: "string", description: "YYYY-MM-DD oder leer" },
        customerOrderNumber: { type: "string" },
        format: { type: "string" },
        material: { type: "string" }
      },
      required: ["kind", "title", "description", "quantity", "deadline", "customerOrderNumber", "format", "material"]
    };

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [{
          role: "user",
          content: [
            {
              type: "input_file",
              filename: file.name,
              file_data: `data:application/pdf;base64,${base64}`
            },
            {
              type: "input_text",
              text: `Lies diese Kundenbestellung für eine Druckerei aus. Extrahiere ausschließlich belegte Angaben. Leere oder nicht eindeutige Felder als leere Zeichenkette ausgeben. Ordne kind möglichst einer dieser Kategorien zu: Printprodukt, Mailing, Faltschachtel / Verpackung, Veredelung, Sonderproduktion, Noch nicht sicher. Kunde: ${company}. Formuliere description als knappe Zusammenfassung der bestellten Druckleistung und besonderer Anforderungen.`
            }
          ]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "print_order_data",
            strict: true,
            schema
          }
        }
      })
    });

    const payload = await aiResponse.json();
    if (!aiResponse.ok) {
      console.error("OpenAI PDF analysis failed", payload);
      return Response.json({ error: payload?.error?.message || "Die KI-Auswertung ist fehlgeschlagen." }, { status: 502 });
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      return Response.json({ error: "Die KI hat keine auswertbaren Daten zurückgegeben." }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(outputText);
    } catch {
      const match = outputText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Keine JSON-Daten gefunden");
      data = JSON.parse(match[0]);
    }

    return Response.json({ mode: "ai", data });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Die PDF konnte nicht verarbeitet werden." }, { status: 500 });
  }
}
