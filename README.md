# druckkultur desk – vollständige Vorführversion

Next.js-Webapp für einen persönlichen digitalen Projektraum zwischen druckkultur und ihren Kunden. Die Anwendung ist bewusst **kein Online-Shop**. Sie zeigt, wie persönliche Beratung, schnelle Reaktion, Projekte, Nachrichten, Dateien, Freigaben und Rückrufe in einem gemeinsamen Arbeitsraum funktionieren können.

## Was in dieser Version vollständig vorführbar ist

- getrenntes Kunden- und Mitarbeiterlogin
- mehrere Firmen mit eigenen Mitarbeitern, Rollen, Logo und Farbwelt
- Teamleitung sieht alle Firmenprojekte
- eingeschränkte Benutzer sehen nur zugewiesene Projekte
- firmenübergreifender Wechsel für druckkultur-Mitarbeiter
- ungelesene Nachrichten je Firma und Projekt
- direkte Nachrichten an einzelne Ansprechpartner
- projektbezogene Nachrichten mit Zustell- und Lesestatus
- Rückrufwünsche mit hinterlegter Kundentelefonnummer
- sofortiges Rückruf-Popup beim zuständigen Mitarbeiter
- eigene Rückrufzentrale mit offenen und erledigten Rückrufen
- `tel:`-Verknüpfung für eine am PC eingerichtete Telefonie- oder Softphone-App
- Projekte öffnen als vollständige Arbeitsseite, nicht mehr als seitliches Modal
- Mitarbeiter können Status, Fortschritt, nächsten Schritt, Liefertermin, Zuständigkeit und Kundenzuordnung ändern
- Kunden können Freigaben erteilen
- echte Datei-Uploads bis 20 MB in die Browser-Datenbank
- hochgeladene Dateien lassen sich wieder herunterladen
- Dateien können einem bestehenden Projekt oder einer neuen Anfrage zugeordnet werden
- deutlich größere Typografie und vereinfachte Übersichtsseite
- alle Änderungen bleiben im verwendeten Browser erhalten

## Demo-Zugänge

Das Passwort lautet bei allen Benutzern:

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

Die Konten lassen sich auf der Loginseite anklicken.

## Empfohlener Vorführablauf

1. Als `maria@vitanova.demo` anmelden.
2. Unter **Kontakte** Andreas direkt eine Nachricht schreiben.
3. Einen Rückrufwunsch senden. Die Telefonnummer wird aus Marias Benutzerkonto übernommen.
4. Ein neues Projekt anlegen und dabei eine PDF oder ein Bild hochladen.
5. Abmelden und als `andreas@druckkultur.demo` anmelden.
6. Der Rückrufwunsch erscheint sofort als Popup. Über **Jetzt anrufen** wird die am PC hinterlegte Telefonie-App geöffnet.
7. Das neue Projekt öffnen und im Bereich **Projekt steuern** Status, nächsten Schritt und Liefertermin ändern.
8. Unter **Dokumente** die hochgeladene Originaldatei wieder herunterladen.
9. Wieder als Maria anmelden und die geänderte Kundensicht prüfen.

## Dateiablage im Vorführmodus

Metadaten, Nachrichten, Projekte und Rechte werden in `localStorage` gespeichert. Hochgeladene Dateien werden separat in `IndexedDB` gespeichert. Dadurch können sie in derselben Browserinstallation tatsächlich wieder heruntergeladen werden.

Die Vorführung funktioniert daher auch nach einem Neuladen der Seite. Sie ist jedoch nicht für vertrauliche Echtdaten gedacht. Beim Wechsel auf ein anderes Gerät oder einen anderen Browser stehen die lokal gespeicherten Daten nicht zur Verfügung.

## Wichtige Abgrenzung

Diese Version ist eine **vollständig bedienbare Produktvorführung**, aber noch kein sicherer Mehrbenutzer-Produktivbetrieb. Für echte Kunden müssen Login, Rechte, Nachrichten, Rückrufe und Dateien serverseitig gespeichert und geprüft werden. Die Benutzeroberfläche und Abläufe können dafür weitgehend übernommen werden.

## Lokal starten

Voraussetzung: Node.js 22 oder neuer.

```bash
npm install
npm run dev
```

Danach `http://localhost:3000` öffnen.

## GitHub aktualisieren

Den Inhalt dieses Ordners in das vorhandene GitHub-Repository kopieren und die bisherigen Dateien ersetzen:

```bash
git add .
git commit -m "Vollständige Vorführversion mit Rückrufen, Uploads und Projektsteuerung"
git push
```

Webflow Cloud startet nach dem Push normalerweise ein neues Deployment.

## Webflow Cloud

Root directory, wenn `package.json` direkt im Repository liegt:

```text
./
```

Umgebungsvariable:

```text
WEBFLOW_CLOUD_MOUNT_PATH=/portal
```

Der in Webflow eingestellte Mount-Pfad muss ebenfalls `/portal` sein.

## Projektstruktur

```text
app/
  globals.css       Gestaltung, größere Typografie und Responsive Design
  layout.js         Metadaten und Grundlayout
  page.js           Einstieg
components/
  PortalApp.jsx     gesamte Funktionslogik und alle Ansichten
  Icon.jsx          lokale SVG-Icons
data/
  mock-data.js      Firmen, Benutzer, Projekte, Nachrichten, Dokumente, Rückrufe
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
- relationale Datenbank mit echter Mandantentrennung
- serverseitige Rechteprüfung für jede Aktion
- geschützte Dateiablage mit Virenscan
- Benachrichtigungen per E-Mail, Teams oder Push
- Anbindung an Telefonanlage beziehungsweise Softphone-Protokoll
- revisionssichere Freigabeprotokolle
- Anbindung an Auftragsübersicht, Plantafel oder MIS
- Datenschutz, Backups und Löschkonzept
