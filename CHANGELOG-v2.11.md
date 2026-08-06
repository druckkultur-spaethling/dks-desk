# druckkultur Portal 2.11

## Behoben

- Der automatische API-Fallback von `/app/api/...` auf `/api/...` wurde vollständig entfernt.
- Die App verwendet ausschließlich den Mount-Pfad, unter dem sie im Browser geöffnet wurde.
- In der Sidebar wird zusätzlich das konkrete API-Ziel angezeigt, z. B. `API www.druckkultur.de/app`.
- Ein Wechsel der Datenbankkennung während einer laufenden Sitzung wird erkannt und die Synchronisierung gestoppt.
- Die State- und Health-API liefern Host und Mount-Pfad für eine eindeutige Diagnose zurück.

## Hintergrund

Version 2.10 konnte bei einer 404 am erwarteten Mount-Pfad auf die Root-API ausweichen. Wenn dort eine andere Webflow-Environment veröffentlicht war, arbeiteten zwei Browser trotz ähnlicher URL mit getrennten Datenbanken. Version 2.11 verhindert dieses Verhalten.
