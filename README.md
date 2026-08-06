# druckkultur Portal – Version 2.12

## Neu in Version 2.12

### Nachrichten in richtiger Reihenfolge

- Nachrichten innerhalb einer Unterhaltung werden streng chronologisch nach `createdAt` sortiert.
- Jede Nachricht zeigt ihre Uhrzeit.
- Zwischen verschiedenen Tagen erscheint eine Datumstrennung wie „Heute“, „Gestern“ oder das konkrete Datum.
- Die Unterhaltungsübersicht ist nach der jeweils letzten Nachricht sortiert. Das zuletzt aktive Gespräch steht oben.
- In der Übersicht wird neben jedem Gespräch die Uhrzeit beziehungsweise das Datum der letzten Nachricht angezeigt.

### Projekte als skalierbare Liste

Die Projektseite verwendet keine Kacheln mehr. Stattdessen gibt es eine kompakte Tabelle mit:

- Projektname, Projektnummer und Kategorie
- Status
- nächstem Schritt und Fälligkeit
- Ansprechpartnern auf Kunden- und druckkultur-Seite
- Liefertermin
- Fortschritt
- Kennzeichnung neuer Projekte

Die Tabellenüberschrift bleibt beim Scrollen sichtbar. Die Ansicht ist auch für große Projektmengen ausgelegt.

### Helle und dunkle Darstellung

Oben rechts neben dem angemeldeten Benutzer befindet sich der Umschalter `Hell` / `Dunkel`.

Die Auswahl wird direkt im jeweiligen Benutzerkonto als `themePreference` gespeichert und über die gemeinsame Datenbank synchronisiert. Jeder Benutzer behält deshalb seine eigene Darstellung – auch nach dem Abmelden oder auf einem anderen Rechner.

## GitHub aktualisieren

Am sichersten ist es, den vollständigen Inhalt des entpackten Ordners in das bestehende Repository zu übernehmen.

Mindestens geändert wurden:

```text
components/PortalApp.jsx
components/Icon.jsx
app/globals.css
package.json
VERSION.txt
README.md
CHANGELOG-v2.12.md
```

Nach dem Webflow-Deployment muss unten links stehen:

```text
Version 2.12
```

## Prüfung

1. Auf zwei Rechnern `https://www.druckkultur.de/app` öffnen.
2. Prüfen, dass beide dieselbe DB-Kennung anzeigen.
3. Mehrere Nachrichten in unterschiedlicher Reihenfolge senden und die chronologische Darstellung kontrollieren.
4. Zwischen Hell und Dunkel wechseln, abmelden und erneut mit demselben Benutzer anmelden.
5. Die Projektseite öffnen und Filter sowie Suche testen.

## Technischer Hinweis

Die Darstellung wird nicht nur lokal im Browser gespeichert. Sie ist Bestandteil des zentral gespeicherten Benutzerprofils. Änderungen an der Darstellung erhöhen deshalb wie andere Benutzereinstellungen den gemeinsamen Datenstand.
