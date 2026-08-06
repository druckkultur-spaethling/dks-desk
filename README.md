# druckkultur desk – Vorführversion 0.4

Next.js-Webapp für einen persönlichen digitalen Projektraum zwischen druckkultur und ihren Kunden. Die Anwendung ist bewusst **kein Online-Shop**. Sie zeigt persönliche Beratung, schnelle Reaktion, Projekte, Status, Nachrichten, Dateien, Freigaben und Gesprächswünsche in einem gemeinsamen Arbeitsraum.

## Neu in Version 0.4

- Mitarbeiter können zahlreiche Druckerei-Status auswählen
- zusätzlicher eigener Projektstatus kann frei eingegeben werden
- jede Statusänderung wird mit Mitarbeiter, Zeitpunkt und Notiz protokolliert
- Button **Projekt erstellen** direkt in der Projektübersicht
- Dokumente können jederzeit in jedem Projekt hochgeladen werden
- kundenseitige Dokumentarten: Druckdaten, Anfrage, Bestellung, AB-Mahnung, Liefermahnung, Sonstiges
- mitarbeiterseitige Dokumentarten: Angebot, AB, Freigabedaten, Lieferschein, Sonstiges
- Dokumentart kann bereits beim Erstellen eines Projekts gewählt werden
- Bestell-PDF kann automatisch ausgewertet und in Projektfelder übernommen werden
- echte OpenAI-Auswertung über eine serverseitige API-Route möglich
- ohne API-Schlüssel steht eine deutlich gekennzeichnete Vorführanalyse bereit
- Nachrichtenansicht öffnet nicht mehr automatisch die zuletzt verwendete Unterhaltung
- eigener Button **Neue Nachricht** mit Auswahl von Person oder Projekt
- Gesprächswunsch wahlweise über Telefon oder Microsoft Teams
- Teams-Konto kann in den Firmeneinstellungen je Benutzer hinterlegt werden

## Demo-Zugänge

Das Passwort lautet bei allen Konten:

```text
demo
```

### Kunden

```text
laura@vitanova.demo      Teamleitung, alle VitaNova-Projekte
maria@vitanova.demo      Marketing, nur zugewiesene Projekte
thomas@vitanova.demo     Qualitätssicherung, nur zugewiesene Projekte
sabine@musterwerke.demo  Teamleitung, alle Musterwerke-Projekte
david@musterwerke.demo   Produktmarketing, nur zugewiesene Projekte
nina@musterwerke.demo    Einkauf, alle Projekte und Finanzdokumente
lena@alpenkraft.demo     Brand Management, alle Projekte
jonas@alpenkraft.demo    Produktmanagement, nur zugewiesene Projekte
```

### druckkultur-Mitarbeiter

```text
andreas@druckkultur.demo
heinz@druckkultur.demo
mirco@druckkultur.demo
```

## Status als Mitarbeiter vergeben

1. Als druckkultur-Mitarbeiter anmelden.
2. Firma und Projekt öffnen.
3. Rechts im Bereich **Projekt steuern** einen Status auswählen.
4. Alternativ unter **Eigenen Status vergeben** eine freie Bezeichnung eintragen.
5. Nächsten Schritt, Kundenerklärung, Termin und optionale Statusnotiz ergänzen.
6. **Status und Projekt speichern** anklicken.

Der neue Status ist sofort in der Kundensicht sichtbar und erscheint im Statusprotokoll.

## Bestell-PDF mit KI auswerten

Die App enthält die Route:

```text
/portal/api/analyze-order
```

Für eine echte KI-Auswertung in Webflow Cloud zwei Environment Variables ergänzen:

```text
OPENAI_API_KEY=dein_api_schluessel
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_API_KEY` bleibt ausschließlich auf dem Server. Er darf niemals als `NEXT_PUBLIC_...` angelegt werden.

Ohne API-Schlüssel funktioniert der Vorführablauf trotzdem. Die Anwendung kennzeichnet dann sichtbar, dass realistische Musterdaten eingesetzt werden und keine echte PDF-Inhaltsanalyse stattgefunden hat.

## Empfohlener Vorführablauf

1. Als `maria@vitanova.demo` anmelden.
2. Unter **Projekte** auf **Projekt erstellen** klicken.
3. Ein Bestell-PDF auswählen und **Bestellung automatisch auslesen** anklicken.
4. Erkannte Felder kontrollieren und das PDF als **Bestellung** zuordnen.
5. Unter **Nachrichten** auf **Neue Nachricht** klicken und Andreas auswählen.
6. Unter **Kontakte** einen Telefon- oder Teams-Gesprächswunsch absenden.
7. Abmelden und als `andreas@druckkultur.demo` anmelden.
8. Gesprächswunsch im Popup öffnen.
9. Neues Projekt öffnen, Status ändern und ein Angebot oder Freigabedaten hochladen.
10. Wieder als Maria anmelden und Kundensicht, Statusprotokoll und Dokumente prüfen.

## Dateiablage im Vorführmodus

Metadaten, Nachrichten, Projekte und Rechte werden in `localStorage` gespeichert. Hochgeladene Dateien werden in `IndexedDB` gespeichert. Sie stehen daher im gleichen Browser auch nach dem Neuladen wieder zur Verfügung.

Diese Vorführung ist nicht für vertrauliche Echtdaten bestimmt. Für den Mehrbenutzerbetrieb sind Datenbank, geschützte Dateiablage, sichere Anmeldung und serverseitige Rechteprüfung erforderlich.

## GitHub und Webflow Cloud

Wenn `package.json` direkt auf der ersten Ebene des GitHub-Repositorys liegt:

```text
Root directory: ./
```

Erforderliche Variable für die Einbindung unter `/portal`:

```text
WEBFLOW_CLOUD_MOUNT_PATH=/portal
```

Optional für echte PDF-KI:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

Nach dem Hochladen der neuen Dateien einen neuen Commit auf `main` erstellen. Webflow Cloud startet danach normalerweise automatisch ein Deployment.

## Projektstruktur

```text
app/
  api/analyze-order/route.js  serverseitige PDF-KI-Auswertung
  globals.css                 Gestaltung und Responsive Design
  layout.js
  page.js
components/
  PortalApp.jsx               Funktionslogik und Ansichten
  Icon.jsx
data/
  mock-data.js
public/
  favicon.svg
  manifest.webmanifest
next.config.mjs
open-next.config.ts
webflow.json
wrangler.jsonc
```

## Für den echten Betrieb noch erforderlich

- serverseitige Anmeldung und sichere Sitzungen
- relationale Datenbank mit Mandantentrennung
- serverseitige Rechteprüfung für jede Aktion
- geschützte Dateiablage mit Virenscan
- Benachrichtigungen per E-Mail, Teams oder Push
- revisionssichere Freigabe- und Statusprotokolle
- Anbindung an Auftragsübersicht, Plantafel oder MIS
- Datenschutz, Backups und Löschkonzept
