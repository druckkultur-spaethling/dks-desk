export const runtime = "nodejs";

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString("base64");
}

function demoResult(fileName, company) {
  const base = fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
  return {
    kind: /falt|verpack|karton/i.test(base) ? "Faltschachtel / Verpackung" : "Printprodukt",
    title: base && !/^bestellung$/i.test(base) ? base : "Beispielprodukt aus Kundenbestellung",
    description: `Bestellung von ${company || "Kundenseite"}. Ausführung, Lieferadresse und Druckdaten müssen persönlich geprüft werden.`,
    quantity: "5.000 Stück",
    deadline: "2026-09-15",
    customerOrderNumber: "PO-DEMO-2026-1845",
    orderDate: "06.08.2026",
    buyerName: "Erika Beispiel",
    buyerEmail: "einkauf@beispielkunde.de",
    buyerPhone: "+49 000 000000",
    supplierNumber: "L-DEMO-01",
    offerNumber: "A-DEMO-2026",
    reference: "PROJEKT-DEMO",
    customerArticleNumber: "ART-DEMO-100",
    supplierArticleNumber: "DK-DEMO-100",
    unitPrice: "0,42 € / Stück",
    totalPrice: "2.100,00 €",
    deliveryAddress: `Beispielkunde GmbH\nMusterstraße 1\n12345 Musterstadt`,
    deliveryTerms: "frei Haus",
    paymentTerms: "30 Tage netto",
    specialInstructions: "Vor Serienproduktion Muster und Kennzeichnungsvorgaben prüfen.",
    format: "210 × 297 mm",
    material: "nach persönlicher Abstimmung"
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
        orderDate: { type: "string" },
        buyerName: { type: "string" },
        buyerEmail: { type: "string" },
        buyerPhone: { type: "string" },
        supplierNumber: { type: "string" },
        offerNumber: { type: "string" },
        reference: { type: "string" },
        customerArticleNumber: { type: "string" },
        supplierArticleNumber: { type: "string" },
        unitPrice: { type: "string" },
        totalPrice: { type: "string" },
        deliveryAddress: { type: "string" },
        deliveryTerms: { type: "string" },
        paymentTerms: { type: "string" },
        specialInstructions: { type: "string" },
        format: { type: "string" },
        material: { type: "string" }
      },
      required: ["kind", "title", "description", "quantity", "deadline", "customerOrderNumber", "orderDate", "buyerName", "buyerEmail", "buyerPhone", "supplierNumber", "offerNumber", "reference", "customerArticleNumber", "supplierArticleNumber", "unitPrice", "totalPrice", "deliveryAddress", "deliveryTerms", "paymentTerms", "specialInstructions", "format", "material"]
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
              text: `Lies diese B2B-Kundenbestellung für eine Druckerei aus. Extrahiere ausschließlich eindeutig belegte Angaben; fehlende oder mehrdeutige Werte bleiben leer. Berücksichtige Kopfbereich, Ansprechpartner im Einkauf, Bestell- und Angebotsnummern, Referenzen, Artikelnummern beider Seiten, Bezeichnung, Menge und Einheit, Preisangaben, Liefertermin, abweichende Lieferadresse, Liefer- und Zahlungsbedingungen sowie deutlich hervorgehobene Muster-, Kennzeichnungs- oder Anliefervorgaben. Ordne kind möglichst einer dieser Kategorien zu: Printprodukt, Mailing, Faltschachtel / Verpackung, Veredelung, Sonderproduktion, Noch nicht sicher. Kunde: ${company}. Verwende title für die konkrete Produktbezeichnung. Formuliere description als knappe Zusammenfassung der Druckleistung; specialInstructions enthält alle besonderen Vorgaben möglichst vollständig.`
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
