# Änderungen Version 2.7

- API-Pfad wird im Browser aus der tatsächlich geöffneten Webflow-Adresse ermittelt.
- Bei HTTP 404 prüft die App automatisch den alternativen Root-Pfad.
- Abhängigkeit von `WEBFLOW_CLOUD_MOUNT_PATH` und buildzeitlichem `BASE_URL` entfernt.
- `next.config.mjs` enthält keinen manuell gesetzten `basePath` oder `assetPrefix` mehr; Webflow übernimmt das Mounting.
- PDF-Analyse, SQLite-Synchronisierung sowie Datei-Upload und -Download verwenden dieselbe robuste API-Auflösung.
- Neue Uploads speichern keine umgebungsabhängige Download-URL mehr, sondern nur den zentralen Storage-Schlüssel.
- Diagnosemeldung nennt die tatsächlich getesteten API-Adressen.
- Versionsanzeige auf 2.7 aktualisiert.
