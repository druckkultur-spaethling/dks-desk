# druckkultur desk – Version 2.9

Version 2.9 behebt den Webflow-D1-Fehler `D1_EXEC_ERROR ... incomplete input` beim erstmaligen Erstellen der zentralen Tabellen.

## Ursache

`D1Database.exec()` behandelt Zeilenumbrüche als Trennung einzelner SQL-Anweisungen. Der bisher formatierte Block wurde deshalb bereits nach `CREATE TABLE IF NOT EXISTS app_state (` ausgeführt und war unvollständig.

## Korrektur

Die Tabellen `app_state` und `sync_audit` werden nun über zwei vorbereitete Anweisungen in `db.batch()` angelegt. Die vorhandene Migration bleibt zusätzlich bestehen.

## GitHub aktualisieren

Mindestens ersetzen:

- `app/api/state/route.js`
- `components/PortalApp.jsx`
- `package.json`
- `VERSION.txt`
- `README.md`
- `CHANGELOG-v2.9.md`

Sicherer ist es, den gesamten Inhalt des entpackten Ordners hochzuladen. `package.json` muss direkt im Hauptverzeichnis des Repositorys liegen.

## Webflow-Pfad

Wenn die App als Bestandteil der bestehenden Webflow-Seite eingerichtet wurde, ist der Mount-Pfad `/app` korrekt. Die Adresse lautet dann:

`https://www.druckkultur.de/app`

Ein eigener Host wie `app.druckkultur.de` ist eine alternative, eigenständige Bereitstellung und nicht für die Funktion der Datenbank erforderlich.

## Nach dem Deployment prüfen

1. Unten links muss `Version 2.9` stehen.
2. `https://www.druckkultur.de/app/api/health` aufrufen.
3. Erwartete Antwort: `ok: true`, `database: true`.
4. Danach Portal öffnen und auf zwei Geräten eine Nachricht testen.

## Hinweis

Die Demo-Anmeldung ist weiterhin nicht für echte vertrauliche Kundendaten vorgesehen.
