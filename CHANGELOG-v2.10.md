# druckkultur Portal 2.10

## Firmenlogo in der Sidebar

- Der Firmenwechsler verwendet für Logos keine 36 × 36 px große quadratische Miniatur mehr.
- Logos werden in einer 64 × 40 px großen, weißen Fläche vollständig dargestellt.
- `object-fit: contain` verhindert Beschnitt und Verzerrung.
- Firmen ohne Logo behalten eine kompakte Initialenanzeige.

## Gemeinsame Datenbank

- Jeder Datenbank wird einmalig eine eindeutige Instanzkennung zugewiesen.
- In der Sidebar werden Datenstand und die ersten acht Zeichen der Datenbankkennung angezeigt.
- Beide Test-PCs müssen dieselbe Datenbankkennung sehen.
- Daten werden über eine D1-Session mit `first-primary` gelesen.
- Ein Speichervorgang wird erst als erfolgreich angezeigt, nachdem der neue Datenstand erneut aus der zentralen Datenbank gelesen wurde.
- Nach jeder Änderung wird der Datenstand innerhalb derselben Datenbanksession verifiziert.
- Der automatische Abruf wurde von zwei Sekunden auf 1,5 Sekunden verkürzt.
- API-Antworten enthalten zusätzliche No-Cache-Header.

## Diagnose

`/app/api/health` zeigt jetzt zusätzlich:

- aktuelle Datenrevision,
- Zeitpunkt der letzten Datenänderung,
- Datenbank-Instanzkennung,
- verwendeten Speichermodus.
