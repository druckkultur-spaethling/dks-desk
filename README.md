# druckkultur desk – Version 2.5

Version 2.5 stellt die Vorführung von einer reinen Browser-Demo auf einen gemeinsamen Mehrgeräte-Datenstand um.

## Wichtig: GitHub ist nicht die Live-Datenbank

GitHub speichert weiterhin:

- den Next.js-Quellcode
- das Ausgangs-Datenmodell
- Datenbankmigrationen
- die Webflow-Cloud-Konfiguration

Laufende Firmen-, Benutzer-, Projekt-, Nachrichten-, Rückruf- und Dokumentdaten werden in **Webflow Cloud SQLite** gespeichert. Hochgeladene PDFs und andere Dateien werden im **Webflow Cloud Object Storage** abgelegt.

Das ist notwendig, weil eine Browser-App nicht sicher und zuverlässig direkt in ein GitHub-Repository schreiben kann. Ein dafür nötiger GitHub-Schlüssel wäre im Browser angreifbar; außerdem ist GitHub nicht für gleichzeitige Transaktionen mehrerer Benutzer ausgelegt.

## Neu in Version 2.5

- zentraler gemeinsamer Datenstand für mehrere Rechner
- automatische Aktualisierung etwa alle fünf Sekunden
- sichtbarer Live-/Speicherstatus in Sidebar und Kopfzeile
- Firmenlogo und Firmenname werden beim Firmenwechsel sofort aus dem gemeinsamen Datenstand verwendet
- bei einem Mitarbeiter ist nach einer neuen Anmeldung keine Firma vorausgewählt
- Mitarbeiter wählen zunächst bewusst einen Kundenarbeitsraum
- Projektdaten können von berechtigten Mitarbeitern und Kunden bearbeitet werden
- jede Projektänderung wird mit Benutzer, Zeit und alten/neuen Werten protokolliert
- bei einer Änderung entsteht automatisch eine Projektnachricht
- Recht **„Projektdaten bearbeiten“** in den Firmenbenutzereinstellungen
- Uploads werden zentral gespeichert und können auf einem anderen Gerät heruntergeladen werden
- Versionsanzeige unten links: `Version 2.5`

## Webflow-Cloud-Speicher

Die Datei `wrangler.jsonc` deklariert zwei Speicherressourcen:

```text
DB
```

SQLite-Datenbank für strukturierte Daten.

```text
CLOUD_FILES
```

Object Storage für PDFs, Bilder und andere hochgeladene Dokumente.

Beim Deployment über das mit Webflow verbundene GitHub-Repository legt Webflow Cloud diese Ressourcen an. Nach einem erfolgreichen Deployment findest du sie in:

```text
Webflow Dashboard
→ App öffnen
→ Environment öffnen
→ Storage
```

Dort sollten sichtbar sein:

```text
DB              SQLite
CLOUD_FILES     Object Storage
```

### Falls der Bereich „Storage“ nach dem Deployment fehlt

Bei einer bereits bestehenden Webflow-Cloud-App kann es nötig sein, die App einmal über `… → Edit → Save Changes` neu zu speichern und anschließend erneut zu deployen. Danach sollten die Bindings `DB` und `CLOUD_FILES` im Storage-Bereich erscheinen.

## Aktualisierung über GitHub im Browser

1. `druckkultur-portal-v2.5.zip` herunterladen.
2. ZIP-Datei unter Windows vollständig entpacken.
3. Im GitHub-Repository die bisherigen Programmordner löschen:

```text
app
components
data
public
```

4. Falls vorhanden, auch den alten Ordner `migrations` löschen.
5. In GitHub `Add file → Upload files` wählen.
6. Den **Inhalt** des entpackten Ordners hochladen, nicht den Ordner selbst.
7. Kontrollieren, dass `package.json`, `wrangler.jsonc` und `VERSION.txt` direkt auf der ersten Repository-Ebene liegen.
8. `Commit directly to the main branch` wählen.
9. Commit speichern.
10. Webflow startet automatisch ein neues Deployment.

## Webflow-Einstellungen

Root directory:

```text
./
```

Environment Variable:

```text
WEBFLOW_CLOUD_MOUNT_PATH=/portal
```

Der Mount Path der Environment muss ebenfalls `/portal` sein.

Optional für die echte KI-Auswertung von Bestell-PDFs:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

Ohne OpenAI-Schlüssel arbeitet die Bestellerkennung weiterhin im gekennzeichneten Vorführmodus.

## Erster Start

Beim ersten Aufruf legt die API automatisch den gemeinsamen Ausgangsdatenstand in der Webflow-SQLite-Datenbank an. Browserdaten aus Version 2.4 werden nicht übernommen.

Danach gilt:

- Änderungen auf Rechner A werden zentral gespeichert.
- Rechner B lädt neue Revisionen automatisch.
- Bei gleichzeitiger Bearbeitung derselben Daten verhindert eine Revisionsprüfung stilles Überschreiben.
- Im Konfliktfall wird der neueste gemeinsame Stand geladen und eine Meldung angezeigt.

## Projektbearbeitung

Ein Benutzer darf Projektdaten ändern, wenn sein Recht `editProjects` aktiviert ist und er das Projekt sehen darf.

Bearbeitbar sind unter anderem:

- Projektname
- Produktart
- Auflage
- Liefertermin
- Format
- Material
- Bestellnummer
- Referenz
- Ausführung
- besondere Hinweise

Mitarbeiter mit Bearbeitungsrecht können zusätzlich Status, Projektverlauf, Zuständigkeiten und Kundenzuordnung steuern.

Jede Änderung erscheint im Statusprotokoll als **„Projektdaten geändert“**. Zusätzlich wird eine neue Nachricht im Projekt erzeugt, damit die Gegenseite die Änderung bemerkt.

## Keine vorausgewählte Firma

Nach einer neuen Mitarbeiteranmeldung öffnet sich die Firmenübersicht. Erst durch Klick auf eine Firma wird deren Arbeitsraum aktiviert. Ein Seiten-Refresh innerhalb derselben Sitzung darf die zuletzt geöffnete Firma beibehalten; nach Abmeldung und erneuter Anmeldung startet die Auswahl wieder leer.

## Vorführzugänge

Das Passwort lautet bei allen Konten:

```text
demo
```

Beispiele:

```text
andreas@druckkultur.demo
maria@vitanova.demo
laura@vitanova.demo
```

## Sicherheitsgrenze dieser Version

Version 2.5 ist ein **gemeinsames Mehrgeräte-Testsystem**, aber noch kein System für echte vertrauliche Kundendaten.

Noch nicht produktionsreif sind insbesondere:

- serverseitige Sitzungen und sichere Passwort-Hashes
- serverseitige Mandanten- und Rechtefilterung jeder API-Anfrage
- Virenscan hochgeladener Dateien
- revisionssichere und unveränderbare Freigabeprotokolle
- Lösch- und Aufbewahrungsregeln
- Datenschutz-, Backup- und Wiederherstellungskonzept

Die gemeinsame Datenbank und Dateiablage sind real. Der Login und die Rechteprüfung dienen in dieser Version weiterhin der Funktionsvorführung. Daher keine echten Kundenaufträge, Preise, personenbezogenen Daten oder vertraulichen Druckdateien einstellen.

Für diesen Mehrgeräte-Test wird der strukturierte Demostand noch kompakt als gemeinsamer Datensatz gespeichert. Große Dateien und PDFs liegen getrennt im Object Storage. Vor einem echten Produktivbetrieb wird das Schema auf einzelne relationale Tabellen für Firmen, Benutzer, Projekte, Nachrichten und Rechte aufgeteilt.

## Technische Struktur

```text
app/api/state/route.js        gemeinsamer SQLite-Datenstand
app/api/files/route.js        zentraler Datei-Upload und Download
migrations/0001_shared_state.sql
data/seed-state.js            Ausgangsdaten für die erste Datenbankanlage
wrangler.jsonc                DB- und Object-Storage-Bindings
components/PortalApp.jsx      Benutzeroberfläche und Synchronisierung
```
