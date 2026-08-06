# druckkultur Portal – Version 2.10

Next.js-Webapp für Webflow Cloud unter dem Mount-Pfad `/app`.

## Wichtigste Prüfung nach dem Deployment

Melden Sie sich auf beiden Test-PCs an. Unten links in der Sidebar steht beispielsweise:

```text
Gemeinsam gespeichert
Stand 14:20 Uhr · Datenstand #17 · DB 9f2a18c4
Version 2.10
```

Auf beiden PCs müssen dieselbe DB-Kennung und nach kurzer Zeit derselbe Datenstand erscheinen.

Unterscheiden sich die DB-Kennungen, greifen die Geräte auf unterschiedliche Webflow-Environments oder unterschiedliche URLs zu. Verwenden Sie auf beiden Geräten exakt:

```text
https://www.druckkultur.de/app
```

Nicht auf einem Gerät die Webflow-Vorschau-URL und auf dem anderen die veröffentlichte Domain verwenden. Webflow-Speicher ist je Environment getrennt.

## Datenbank direkt prüfen

Öffnen Sie auf beiden PCs:

```text
https://www.druckkultur.de/app/api/health
```

Die Werte `instanceId` und `revision` müssen übereinstimmen. Beispiel:

```json
{
  "ok": true,
  "database": true,
  "files": true,
  "revision": 17,
  "instanceId": "9f2a18c4-...",
  "storage": "webflow-sqlite-primary"
}
```

## Synchronisation testen

1. Auf beiden PCs dieselbe URL öffnen.
2. Auf beiden PCs die DB-Kennung vergleichen.
3. Auf PC A eine Firmenfarbe ändern oder eine Nachricht senden.
4. Warten, bis unten links ein höherer Datenstand angezeigt wird.
5. PC B übernimmt den neuen Datenstand normalerweise innerhalb von 1,5 Sekunden.

## GitHub-Aktualisierung

Laden Sie den Inhalt des entpackten Ordners in das bestehende Repository. Ersetzen Sie mindestens:

- `app/api/state/route.js`
- `app/api/health/route.js`
- `app/globals.css`
- `components/PortalApp.jsx`
- `migrations/0002_instance_meta.sql`
- `package.json`
- `VERSION.txt`

Die Datei `package.json` muss direkt im Hauptverzeichnis des Repositorys liegen.

## Webflow

Root directory:

```text
./
```

Mount-Pfad der Environment:

```text
/app
```

Benötigte Storage-Bindings:

- `DB` – SQLite
- `CLOUD_FILES` – Object Storage

## Sicherheit

Die Version ist weiterhin eine gemeinsame Vorführversion mit Demo-Login. Für echte Kundendaten sind serverseitige Authentifizierung, vollständige Mandantenprüfung und ein Datenschutzkonzept erforderlich.
