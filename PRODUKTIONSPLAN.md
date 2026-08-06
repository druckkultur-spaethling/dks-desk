# Produktionsplan – druckkultur desk ab Version 2.10

Version 2.10 schafft einen realen gemeinsamen Daten- und Dateispeicher in Webflow Cloud. Sie ist damit für Mehrgeräte-Tests geeignet. Für den Einsatz mit echten Kunden sind die folgenden Schritte erforderlich.

## 1. Serverseitige Anmeldung

- Passwörter nur als Argon2id- oder vergleichbare sichere Hashes speichern
- Anmeldung über serverseitige API
- HTTP-only-, Secure- und SameSite-Cookies
- Passkeys oder Zwei-Faktor-Authentisierung
- Sperrung und Ablauf von Sitzungen
- Schutz gegen Brute-Force-Angriffe

## 2. Serverseitige Mandantentrennung

Derzeit wird der gemeinsame Zustand für die Vorführung als ein Datenbestand synchronisiert. Produktiv muss jede API-Anfrage serverseitig prüfen:

- welcher Benutzer angemeldet ist
- zu welcher Firma er gehört
- welche Firmen ein interner Mitarbeiter betreuen darf
- welches Projekt sichtbar ist
- welche Felder und Dokumentarten geändert werden dürfen

Kundendaten dürfen nicht nur in der Oberfläche gefiltert werden.

## 3. Relationales Datenmodell

Die Vorführung speichert den Zustand in einem gemeinsamen SQLite-Dokument. Produktiv sollte dieser in einzelne Tabellen aufgeteilt werden:

- companies
- users
- company_memberships
- projects
- project_assignments
- project_changes
- project_status_history
- messages
- message_reads
- documents
- callbacks
- sessions
- audit_log

Damit lassen sich gleichzeitige Änderungen sauberer zusammenführen und gezielte Rechteprüfungen durchführen.

## 4. Dateiablage

Webflow Object Storage ist bereits angebunden. Produktiv zusätzlich:

- erlaubte Dateitypen serverseitig prüfen
- tatsächlichen Dateityp statt nur Dateiendung erkennen
- Virenscan
- Dateigrößen und Speicherkontingente pro Firma
- sichere, zeitlich begrenzte Download-URLs
- Versionierung
- Aufbewahrungs- und Löschregeln
- Protokollierung jedes Downloads

## 5. Projektänderungen

Version 2.10 protokolliert Änderungen bereits sichtbar im Projekt. Produktiv sollte das Audit-Log unveränderbar speichern:

- Benutzer-ID
- Zeitpunkt
- Firma und Projekt
- Feldname
- alter Wert
- neuer Wert
- IP-/Sitzungsreferenz
- Grund der Änderung

Freigaben dürfen nicht durch spätere Änderungen überschrieben werden.

## 6. Echtzeit

Die Vorführung fragt alle fünf Sekunden nach neuen Revisionen. Später möglich:

- Server-Sent Events oder WebSockets
- gezielte Aktualisierung einzelner Firmen und Projekte
- Benachrichtigungen bei Nachricht, Rückruf, Freigabe und Projektänderung
- E-Mail- oder Teams-Hinweise als Ergänzung

## 7. Backups und Betrieb

- automatische Webflow-Cloud-Backups kontrollieren
- Export- und Wiederherstellungsprozess testen
- Monitoring für API-Fehler und Speicherausfälle
- getrennte Test- und Produktionsumgebung
- keine echten Daten in der Demo-Environment
- regelmäßige Rechte- und Sicherheitsprüfung
