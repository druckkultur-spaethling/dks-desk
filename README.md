# druckkultur desk

Next.js-MVP für einen persönlichen digitalen Projektraum zwischen druckkultur und ihren Kunden. Die App ist bewusst **kein Online-Shop**. Im Mittelpunkt stehen direkte Ansprechpartner, Projekte, Entscheidungen, Dateien, Freigaben und schnelle Rückmeldungen.

## Neu in dieser Version

- getrenntes Kunden- und Mitarbeiterlogin
- Mandantenstruktur: mehrere Firmen mit jeweils mehreren Benutzern
- rollenabhängige Projektsicht
  - Teamleitung sieht alle Projekte der Firma
  - Marketing, Einkauf oder QS können auf eigene beziehungsweise zugewiesene Projekte begrenzt werden
- getrennte Rechte für Freigaben, Finanzdokumente, neue Anfragen und Benutzerverwaltung
- Firmeneinstellungen für Logo, Firmenname und individuelle Farbwelt
- firmenübergreifende Mitarbeiteransicht mit Ungelesen-Zähler je Firma
- Projektwechsel, ohne neue Nachrichten anderer Firmen zu übersehen
- Nachrichten mit Zustell- und Lesestatus
- größere Schrift und verbesserte Lesbarkeit
- lokale Demo-Speicherung im Browser
- Webflow-Cloud-Konfiguration für Next.js/OpenNext

## Demo-Zugänge

Das Passwort lautet bei allen Demobenutzern:

```text
demo
```

### Kunden

```text
laura@vitanova.demo     Teamleitung, sieht alle VitaNova-Projekte
maria@vitanova.demo     Marketing, sieht nur zugewiesene Projekte
thomas@vitanova.demo    Qualitätssicherung, sieht nur zugewiesene Projekte
sabine@musterwerke.demo Teamleitung, sieht alle Musterwerke-Projekte
david@musterwerke.demo  Produktmarketing, sieht nur zugewiesene Projekte
nina@musterwerke.demo   Einkauf, sieht alle Projekte und Finanzdokumente
```

### druckkultur-Mitarbeiter

```text
andreas@druckkultur.demo
heinz@druckkultur.demo
mirco@druckkultur.demo
```

Die Konten können direkt auf der Loginseite ausgewählt werden.

## Enthaltene Funktionen

- persönliche Übersicht mit offenen Entscheidungen
- Projektkarten und detaillierte Projektverläufe
- prototypische Druckfreigabe mit Benutzerbezug
- projektbezogene Nachrichten statt unübersichtlicher E-Mail-Ketten
- Lesestatus: „Zugestellt“ beziehungsweise „Gelesen von …“
- Dokumentbereich mit rollenabhängiger Sicht auf Angebote und Rechnungen
- geführte Projektanfrage ohne Warenkorb und automatische Preiszusage
- direkte Ansprechpartner auf Kunden- und druckkultur-Seite
- Firmenverwaltung mit Benutzerrechten
- Kundenbranding mit Logo und Akzentfarben
- responsive dunkle Oberfläche

## Wichtiger Status

Dies ist ein **funktionsfähiger Frontend-MVP**. Anmeldung, Rollen und Mandantentrennung werden in der Benutzeroberfläche realistisch demonstriert, die Daten liegen aber nur im Browser in `localStorage`.

Die Demo ist daher **nicht für echte Kundendaten oder Druckdateien geeignet**. Vor dem Produktivbetrieb müssen ergänzt werden:

1. serverseitige Authentifizierung mit sicheren Sitzungen, Passkeys oder Einmal-Links
2. serverseitige Prüfung jeder Berechtigung – nicht nur Filterung im Frontend
3. relationale Datenbank für Firmen, Benutzer, Rollen, Projekte und Nachrichten
4. verschlüsselte Dateiablage mit Virenscan und zeitlich begrenzten Downloads
5. revisionssichere Freigabeprotokolle
6. E-Mail- und Benachrichtigungsdienst
7. Datenschutz, Backups, Protokollierung und Löschkonzept
8. Anbindung an Auftragsübersicht, Plantafel oder MIS

## Lokal starten

Voraussetzung: Node.js 22 oder neuer.

```bash
npm install
npm run dev
```

Danach `http://localhost:3000` öffnen.

Für die Webflow-Cloud-/Cloudflare-Vorschau:

```bash
npm run preview
```

## Zu GitHub hochladen

1. Bei GitHub ein neues leeres Repository anlegen, beispielsweise `druckkultur-portal`.
2. ZIP-Datei entpacken.
3. Im Repository **Add file → Upload files** wählen.
4. Den Inhalt des entpackten Ordners hochladen. `package.json` muss direkt im Repository-Hauptverzeichnis liegen.
5. Mit **Commit changes** speichern.

Alternativ per Git:

```bash
git init
git add .
git commit -m "druckkultur desk mit Mandanten und Rollen"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/druckkultur-portal.git
git push -u origin main
```

## In Webflow Cloud bereitstellen

1. Webflow Dashboard öffnen.
2. **Create app / Deploy app** wählen.
3. GitHub verbinden und das Repository auswählen.
4. Branch `main` auswählen.
5. Als Ziel eine vorhandene Webflow-Seite oder eine eigene Domain wählen.
6. Für einen Pfad wie `druckkultur.de/portal` in Webflow den Mount-Pfad `/portal` setzen.
7. Folgende Umgebungsvariable anlegen:

```text
WEBFLOW_CLOUD_MOUNT_PATH=/portal
```

Mount-Pfad und Umgebungsvariable müssen identisch sein.

## Projektstruktur

```text
app/
  globals.css       Gestaltung, größere Typografie und Responsive Design
  layout.js         Metadaten und Grundlayout
  page.js           Einstieg
components/
  PortalApp.jsx     Login, Mandanten, Rechte und sämtliche Ansichten
  Icon.jsx          lokale SVG-Icons
data/
  mock-data.js      Firmen, Benutzer, Projekte, Nachrichten und Dokumente
public/
  favicon.svg
  manifest.webmanifest
next.config.mjs
open-next.config.ts
webflow.json
wrangler.jsonc
```

## Datenmodell der Demo

```text
Firma
├── Firmenbranding
├── zugeordnete druckkultur-Mitarbeiter
├── Kundenbenutzer
│   └── individuelle Rechte
├── Projekte
│   └── zugeordnete Kundenbenutzer
├── Nachrichten
│   └── readBy[] für Lesestatus
└── Dokumente
    └── optional als kaufmännisch gekennzeichnet
```

## Sinnvolle nächste Entwicklungsstufe

Für einen ersten echten Piloten sollte zunächst ein Backend mit Authentifizierung, Datenbank und sicherer Dateiablage entstehen. Danach können die bestehenden Demo-Ansichten nahezu unverändert gegen echte API-Routen arbeiten.
