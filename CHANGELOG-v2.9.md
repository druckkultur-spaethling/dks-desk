# Änderungen Version 2.9

## Behoben

- D1-Fehler `CREATE TABLE IF NOT EXISTS app_state (: incomplete input`
- Schemaerstellung verwendet nun `db.batch()` mit zwei vollständigen Prepared Statements.
- Versionsanzeige auf 2.9 erhöht.

## Unverändert

- Mount-Pfad `/app`
- zentrale SQLite-Datenhaltung
- Object Storage für Dokumente
- Firmen-, Projekt-, Nachrichten- und Rückruffunktionen
