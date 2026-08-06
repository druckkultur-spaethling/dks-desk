# druckkultur Portal – Version 2.11

## Wichtigste Korrektur

Die Portal-App verwendet unter `https://www.druckkultur.de/app` ausschließlich folgende API:

```text
https://www.druckkultur.de/app/api/...
```

Ein automatischer Wechsel zu `https://www.druckkultur.de/api/...` findet nicht mehr statt. Dadurch können Kunden- und Mitarbeiterkonten nicht mehr unbemerkt auf verschiedene Webflow-Datenbanken zugreifen.

## Anzeige in der Sidebar

Nach erfolgreicher Verbindung steht unten links beispielsweise:

```text
Gemeinsam gespeichert
Datenstand #21 · DB 821bb709 · API www.druckkultur.de/app
Version 2.11
```

Auf allen Rechnern müssen DB-Kennung und API-Ziel identisch sein.

## GitHub aktualisieren

Die wichtigsten geänderten Dateien sind:

```text
components/PortalApp.jsx
app/api/state/route.js
app/api/health/route.js
package.json
VERSION.txt
README.md
CHANGELOG-v2.11.md
```

Am sichersten ist es, den vollständigen Inhalt des entpackten Ordners in das bestehende Repository zu übernehmen.

## Test

1. Auf beiden Rechnern ausschließlich `https://www.druckkultur.de/app` öffnen.
2. Mit `Strg + F5` neu laden.
3. Unten links Version, Datenbank und API vergleichen.
4. Auf Rechner A eine Nachricht senden.
5. Auf Rechner B muss sich der Datenstand innerhalb weniger Sekunden erhöhen.

## Getrennte alte Datenstände

Die Datenstände der zuvor verwendeten Datenbanken werden nicht automatisch zusammengeführt. Nach Version 2.11 verwenden alle Browser den Datenstand der Datenbank, die tatsächlich an `/app/api/...` gebunden ist.
