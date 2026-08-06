# Änderungen in Version 2.6

## Firmenwechsel

- „Alle Firmen“ als erster Eintrag im Firmenwechsler ergänzt.
- Aufruf der Firmenübersicht entfernt die aktive Firmenauswahl.
- Wechsel auf `null` öffnet zuverlässig die Mandantenübersicht.

## Live-Synchronisierung

- Polling von fünf auf zwei Sekunden verkürzt.
- Cache-Busting für jeden Abruf des gemeinsamen Datenstands ergänzt.
- Synchronisation bei Rückkehr in den Tab und bei erneutem Online-Status.
- API-Basispfad verwendet Webflows `BASE_URL` vor der manuellen Mount-Path-Variable.
- `wrangler.jsonc` in `wrangler.json` umbenannt.

## Diagnose

- neuer Endpunkt `/api/health`
- konkrete Meldung bei fehlender SQLite-Bindung `DB`
- dauerhafte Warnleiste bei fehlender gemeinsamer Verbindung
- Synchronisationsanzeige ist anklickbar und startet einen erneuten Verbindungsversuch

## Nachrichten

- direkte und projektbezogene Nachrichten setzen einen eindeutigen Synchronisationsereignistext
- Nachrichtenversand wird bei fehlender gemeinsamer Verbindung blockiert, statt nur lokal als gesendet zu erscheinen

## Version

- App-Version, Session-Key, `package.json` und `VERSION.txt` auf 2.6 aktualisiert.
