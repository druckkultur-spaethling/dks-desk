# druckkultur desk – Vorführversion 2.4


## Webflow-Kompatibilität

Die PDF-API verwendet weiterhin die in Version 2.3 korrigierte Node.js Runtime, damit Webflow Cloud die Anwendung mit OpenNext bündeln kann.

Next.js-Webapp für einen persönlichen digitalen Projektraum zwischen druckkultur und ihren Kunden. Die Anwendung ist bewusst kein Online-Shop. Sie verbindet persönliche Beratung, Projekte, Nachrichten, Dokumente, Freigaben und Gesprächswünsche in einem gemeinsamen Arbeitsraum.

## Änderungen in Version 2.4

- Umbenannte Firmen erscheinen sofort mit dem neuen Namen im Firmenwechsel, in Übersichten, Login-Auswahl und Kopfbereich.
- Kurzname und Initialen werden aus dem neuen Firmennamen automatisch aktualisiert.
- Kundenlogos werden vor dem Speichern automatisch optimiert und anschließend in allen Firmenansichten aktualisiert.
- Zu große oder ungültige Logodateien erzeugen eine verständliche Fehlermeldung statt stillschweigend ignoriert zu werden.
- Firmenbenutzer können mit Sicherheitsabfrage gelöscht werden.
- Projekte eines gelöschten Benutzers werden automatisch einem verbleibenden Firmenbenutzer zugeordnet.
- Der letzte Firmenbenutzer, der aktuell angemeldete Benutzer und – für Kundenadministratoren – der letzte Benutzerverwalter sind gegen versehentliches Löschen geschützt.
- Benutzerdaten und Rechte werden in einer lokalen Bearbeitungsansicht geändert und erst über **Benutzer speichern** übernommen.
- Doppelte Login-E-Mail-Adressen werden verhindert.
- Kunden- und Mitarbeiterlogin sind technisch getrennt; im falschen Loginbereich kann kein Konto des anderen Typs mehr verwendet werden.
- Nur interne Mitarbeiter mit dem Recht `manageCompanies` sehen und bearbeiten Firmeneinstellungen.
- Interne Mitarbeiter werden beim Login als verfügbar und beim Abmelden als offline markiert.
- **Vorführung zurücksetzen** löscht jetzt zusätzlich die in IndexedDB gespeicherten Uploads.
- Die Webflow-kompatible Node.js-Runtime der PDF-API aus Version 2.3 bleibt erhalten.

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

## Arbeitsschritt als erledigt markieren

1. Als druckkultur-Mitarbeiter anmelden.
2. Firma und Projekt öffnen.
3. Rechts den Bereich **Projekt steuern** öffnen.
4. Im Abschnitt **Projektverlauf** beim gewünschten Arbeitsschritt auf **Als erledigt markieren** klicken.
5. Optional eine Notiz ergänzen.
6. **Projektänderungen speichern** anklicken.

Der Schritt erhält ein Häkchen und ein Erledigt-Datum. Die Änderung wird im Statusprotokoll dokumentiert und ist danach auch für den Kunden sichtbar. Mit **Zurücknehmen** kann eine versehentliche Markierung wieder geöffnet werden.

Die verfügbaren Projektstatus bleiben fest vorgegeben. Der Status kann weiterhin passend zum aktuellen Projektstand gewählt werden; die Liste selbst kann nicht erweitert werden.

## Bestell-PDF mit KI auswerten

Die App enthält die serverseitige Route:

```text
/portal/api/analyze-order
```

Für eine echte KI-Auswertung in Webflow Cloud:

```text
OPENAI_API_KEY=dein_api_schluessel
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_API_KEY` bleibt ausschließlich auf dem Server und darf nicht als `NEXT_PUBLIC_...` angelegt werden.

Ohne API-Schlüssel verwendet die App ausschließlich deutlich gekennzeichnete, neutrale Musterdaten. Es werden keine vertraulichen Beispieldaten mitgeliefert.

Die Auswertung versucht folgende Felder zu erkennen:

- Bestellnummer und Bestelldatum
- Einkaufskontakt, E-Mail und Durchwahl
- Lieferantennummer, Angebotsnummer und Referenz
- Produktbezeichnung und Artikelnummern beider Seiten
- Menge, Einzelpreis und Gesamtpreis
- Liefertermin und abweichende Lieferadresse
- Liefer- und Zahlungsbedingungen
- hervorgehobene Muster-, Kennzeichnungs- und Anliefervorgaben

Alle erkannten Daten bleiben vor dem Anlegen des Projekts bearbeitbar. Die persönliche Prüfung durch druckkultur bleibt erforderlich.

## Empfohlener Vorführablauf

1. Als `maria@vitanova.demo` anmelden.
2. Unter **Projekte** auf **Projekt erstellen** klicken.
3. Ein Bestell-PDF auswählen und automatisch auslesen lassen.
4. Angaben kontrollieren und das PDF als **Bestellung** zuordnen.
5. Eine Nachricht oder einen Telefon-/Teams-Gesprächswunsch absenden.
6. Als `andreas@druckkultur.demo` anmelden.
7. Rückrufwunsch im Popup öffnen.
8. Das neue Projekt öffnen.
9. Im Projektverlauf einen Arbeitsschritt als erledigt markieren und speichern.
10. Ein Angebot oder Freigabedaten im Dokumentenbereich hochladen.
11. Wieder als Kunde anmelden und die aktualisierte Kundensicht zeigen.

## Dateiablage im Vorführmodus

Metadaten, Nachrichten, Projekte und Rechte werden in `localStorage` gespeichert. Hochgeladene Dateien werden in `IndexedDB` gespeichert und stehen im gleichen Browser nach dem Neuladen weiterhin zur Verfügung.

Die Vorführversion ist nicht für den realen Austausch vertraulicher Kundendaten bestimmt. Für den Produktivbetrieb werden eine zentrale Datenbank, geschützte Dateiablage, serverseitige Rechteprüfung, Protokollierung und ein Datenschutzkonzept benötigt.

## GitHub und Webflow Cloud

Wenn `package.json` direkt auf der ersten Ebene des GitHub-Repositorys liegt:

```text
Root directory: ./
```

Für die Einbindung unter `/portal`:

```text
WEBFLOW_CLOUD_MOUNT_PATH=/portal
```

Nach dem Hochladen der neuen Dateien einen Commit auf `main` erstellen. Webflow Cloud startet danach normalerweise automatisch ein neues Deployment.

## Projektstruktur

```text
app/
  api/analyze-order/route.js
  globals.css
  layout.js
  page.js
components/
  PortalApp.jsx
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
- relationale Datenbank mit strikter Mandantentrennung
- serverseitige Rechteprüfung für jede Aktion
- geschützte Dateiablage mit Virenscan
- Benachrichtigungen per E-Mail, Teams oder Push
- revisionssichere Freigabe- und Statusprotokolle
- Anbindung an Auftragsübersicht, Plantafel oder MIS
- Datenschutz, Backups und Löschkonzept
