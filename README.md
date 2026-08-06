# druckkultur desk – Version 2.7

Version 2.7 behebt den HTTP-404-Fehler der Portal-API bei unterschiedlichen Webflow-Mount-Pfaden.

## Ursache des Fehlers

Webflow stellt `BASE_URL` erst zur Laufzeit bereit. In Version 2.6 wurde der Wert zusätzlich in der Next.js-Buildkonfiguration verwendet. Je nach Environment konnte dadurch die Oberfläche unter einem anderen Pfad laufen als die API-Aufrufe.

Version 2.7 ermittelt den API-Pfad direkt aus der im Browser geöffneten Adresse. Läuft die App unter `/portal`, werden zuerst `/portal/api/...`-Routen verwendet. Läuft sie am Root-Pfad, werden `/api/...`-Routen verwendet. Antwortet ein Pfad mit 404, prüft die App automatisch die Alternative.

## GitHub aktualisieren

1. `druckkultur-portal-v2.7.zip` entpacken.
2. Im Repository die bisherigen Ordner `app`, `components`, `data`, `public` und `migrations` löschen.
3. Die Dateien `next.config.mjs`, `package.json`, `wrangler.json`, `webflow.json` und `VERSION.txt` ebenfalls durch die neuen Dateien ersetzen.
4. Den Inhalt des entpackten Ordners hochladen. `package.json` muss direkt im Hauptverzeichnis liegen.
5. Direkt in `main` committen und das Webflow-Deployment abwarten.

## Webflow-Einstellungen

Root directory:

```text
./
```

Der Mount-Pfad wird ausschließlich in der Webflow-Environment eingestellt, beispielsweise:

```text
/portal
```

Die selbst angelegte Environment-Variable

```text
WEBFLOW_CLOUD_MOUNT_PATH
```

wird von Version 2.7 nicht mehr benötigt und kann gelöscht werden. Webflow stellt den tatsächlichen Pfad automatisch bereit.

## Verbindung prüfen

Nach dem Deployment muss unten links stehen:

```text
Version 2.7
```

Öffne danach direkt:

```text
https://DEINE-DOMAIN/portal/api/health
```

oder bei einer Root-Environment:

```text
https://DEINE-DOMAIN/api/health
```

Erwartete Antwort:

```json
{
  "ok": true,
  "database": true,
  "files": true
}
```

Falls die Route erreichbar ist, aber `DB_BINDING_MISSING` meldet, liegt der Pfadfehler nicht mehr vor. Dann fehlen noch die Storage-Bindings `DB` und gegebenenfalls `CLOUD_FILES` in der Webflow-Environment.

## Mehrgeräte-Test

1. Auf beiden Rechnern prüfen, dass oben rechts `Live` steht.
2. Rechner A: als Kunde eine Nachricht senden.
3. Rechner B: als Mitarbeiter angemeldet bleiben.
4. Die Nachricht wird normalerweise innerhalb von zwei Sekunden geladen.

## Zentrale Speicherung

- `DB`: Firmen, Benutzer, Projekte, Nachrichten, Lesestatus und Rückrufe
- `CLOUD_FILES`: hochgeladene PDFs, Bilder und andere Dokumente
- GitHub: Quellcode, Schema und Ausgangsdaten, nicht die laufenden Live-Daten

## Sicherheitsgrenze

Version 2.7 ist eine gemeinsame Vorführversion. Die zentrale Speicherung ist real, die Anmeldung verwendet weiterhin Demo-Passwörter. Keine echten vertraulichen Produktionsdaten einstellen.
