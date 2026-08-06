# druckkultur desk – Version 2.6

Version 2.6 behebt den Rückweg aus einem Firmenarbeitsraum und verbessert die gemeinsame Live-Synchronisierung zwischen mehreren Geräten.

## Neu in Version 2.6

- neuer Eintrag **Alle Firmen – Zur Gesamtübersicht** oben im Firmenwechsler
- der Menüpunkt **Firmenübersicht** hebt die aktive Firma ebenfalls auf
- API-Pfade verwenden bevorzugt die von Webflow bereitgestellte `BASE_URL`
- `wrangler.jsonc` wurde in das von Webflow dokumentierte `wrangler.json` umbenannt
- zentrale Daten werden alle zwei Sekunden auf neue Revisionen geprüft
- jeder Lesezugriff erhält eine eindeutige URL, damit kein veralteter API-Stand aus einem Cache verwendet wird
- sofortiger Synchronisationsversuch beim Zurückkehren in den Browser und nach Wiederherstellung der Internetverbindung
- neuer Diagnose-Endpunkt `/api/health`
- konkrete Fehlermeldung bei fehlender `DB`-Bindung statt nur „Offline“
- sichtbare Warnleiste, solange keine gemeinsame Datenbankverbindung besteht
- Nachrichten werden bei unterbrochener Datenbankverbindung nicht mehr fälschlich als gesendet dargestellt
- Versionsanzeige: `Version 2.6`

## Warum stand „Verbindung unterbrochen“ oder „Offline“?

Die Anzeige bezieht sich auf die Verbindung zwischen der Webapp und der zentralen Webflow-Cloud-SQLite-Datenbank. Sie sagt nicht zwingend, dass der PC keine Internetverbindung besitzt.

Wenn `/api/state` die Bindung `DB` nicht erreicht, lädt die Oberfläche nur die lokalen Ausgangsdaten. Änderungen können dann nicht auf einem zweiten Rechner erscheinen.

## Speicher in Webflow kontrollieren

Nach dem Deployment öffnest du:

```text
Webflow Dashboard
→ App öffnen
→ Environment öffnen
→ Storage
```

Dort müssen erscheinen:

```text
DB              SQLite
CLOUD_FILES     Object Storage
```

Fehlt `DB`, kann die App keine Firmen, Projekte oder Nachrichten gemeinsam speichern.

Bei einer bereits vorhandenen App:

1. Bei der App auf `…` klicken.
2. `Edit` auswählen.
3. Ohne weitere Änderung `Save Changes` anklicken.
4. Anschließend Version 2.6 erneut deployen.
5. Danach den Bereich `Storage` erneut kontrollieren.

## Verbindung direkt testen

Bei einem Mount-Pfad `/portal` öffnest du im Browser:

```text
https://DEINE-DOMAIN/portal/api/health
```

Bei erfolgreicher Verbindung erscheint ungefähr:

```json
{
  "ok": true,
  "database": true,
  "files": true
}
```

Fehlt die Datenbankbindung, zeigt die Antwort eine konkrete Meldung mit `DB_BINDING_MISSING`.

## Firmenauswahl zurücksetzen

Als Mitarbeiter gibt es jetzt zwei Wege zurück:

- links unter **Firmen wechseln** auf **Alle Firmen** klicken
- im Hauptmenü **Firmenübersicht** öffnen

Danach ist keine Firma mehr aktiv und die Gesamtübersicht wird angezeigt.

## Nachrichten zwischen mehreren Rechnern testen

1. Auf Rechner A als Kunde anmelden.
2. Prüfen, dass oben rechts `Live` steht.
3. Nachricht an einen Mitarbeiter senden.
4. Auf Rechner B als Mitarbeiter anmelden.
5. Auch dort muss `Live` stehen.
6. Die neue Nachricht erscheint normalerweise innerhalb von zwei Sekunden beim passenden Firmenzähler und im Nachrichtenbereich.

Steht auf einem der Rechner `Verbindung prüfen`, ist dieser Rechner nicht mit dem gemeinsamen Datenstand verbunden. Ein Klick auf die Anzeige startet einen neuen Verbindungsversuch und zeigt den konkreten Fehler.

## GitHub-Aktualisierung im Browser

1. `druckkultur-portal-v2.6.zip` herunterladen und entpacken.
2. Im GitHub-Repository die alten Ordner `app`, `components`, `data`, `public` und `migrations` löschen.
3. Die alte Datei `wrangler.jsonc` löschen, falls sie noch vorhanden ist.
4. `Add file → Upload files` öffnen.
5. Den Inhalt des entpackten Ordners hochladen.
6. Darauf achten, dass diese Dateien direkt im Hauptverzeichnis liegen:

```text
package.json
wrangler.json
webflow.json
VERSION.txt
```

7. Direkt in den Branch `main` committen.
8. Webflow-Deployment abwarten.
9. Unten links kontrollieren: `Version 2.6`.

## Webflow-Konfiguration

Root directory:

```text
./
```

Wenn die App unter `/portal` eingebunden ist, muss der Mount-Pfad der Webflow-Environment `/portal` sein.

Die App verwendet zuerst die von Webflow bereitgestellte `BASE_URL`. Die ältere Variable kann vorerst zusätzlich bestehen bleiben:

```text
WEBFLOW_CLOUD_MOUNT_PATH=/portal
```

## Technische Struktur

```text
app/api/state/route.js        gemeinsamer SQLite-Datenstand
app/api/health/route.js       Verbindungs- und Binding-Diagnose
app/api/files/route.js        zentraler Datei-Upload und Download
migrations/0001_shared_state.sql
wrangler.json                 SQLite- und Object-Storage-Bindings
components/PortalApp.jsx      Oberfläche und Live-Synchronisierung
```

## Sicherheitsgrenze

Version 2.6 ist weiterhin eine gemeinsame Vorführ- und Testversion. Der zentrale Speicher ist real, die Anmeldung verwendet aber weiterhin Vorführpasswörter und noch keine vollständig serverseitige Mandanten-Authentifizierung. Keine echten vertraulichen Kundenaufträge oder personenbezogenen Produktionsdaten einstellen.
