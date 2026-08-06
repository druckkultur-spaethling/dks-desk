# Produktionsplan für den Pilotbetrieb

## 1. Authentifizierung und Sitzungen

- Kunden- und Mitarbeiterkonten serverseitig trennen
- Passkeys oder sichere Einmal-Links bevorzugen
- Passwort-Reset, Kontosperre und Zwei-Faktor-Anmeldung vorsehen
- Sitzungen mit sicheren, HTTP-only Cookies verwalten
- Loginversuche und sicherheitsrelevante Änderungen protokollieren

## 2. Mandantenmodell

- Tabelle `companies` für jede Kundenfirma
- Tabelle `users` für Kunden und druckkultur-Mitarbeiter
- Tabelle `company_memberships` für Zuordnung und Rollen
- ein Mitarbeiter kann mehrere Firmen betreuen
- ein Kundenbenutzer gehört normalerweise zu genau einer Firma
- jede Datenabfrage muss serverseitig auf die Firmenzuordnung geprüft werden

## 3. Rechte

Empfohlene einzelne Berechtigungen:

- alle Projekte der Firma sehen
- nur zugewiesene Projekte sehen
- neue Projekte anfragen
- Druckdaten verbindlich freigeben
- Angebote und Rechnungen sehen
- Dokumente herunterladen
- Benutzer einladen und sperren
- Rechte verwalten
- Firmenlogo und Farbwelt verwalten

Keine Berechtigung darf ausschließlich im Frontend geprüft werden.

## 4. Projekte und Zuordnung

- Projekte gehören immer zu einer Firma
- Projektmitglieder bilden die begrenzte Sicht einzelner Kundenbenutzer ab
- Teamleitungen erhalten über eine Rolle automatisch Zugriff auf alle Firmenprojekte
- druckkultur-Mitarbeiter sehen nur die ihnen zugeordneten Firmen
- Vertretungs- und Urlaubsregeln ergänzen

## 5. Nachrichten und Lesestatus

- Nachrichten projektbezogen speichern
- Zustellung, gelesen am und gelesen von protokollieren
- Ungelesen-Zähler pro Firma und pro Projekt berechnen
- Mitarbeiter erhalten eine firmenübergreifende Reaktionswarteschlange
- E-Mail-Benachrichtigungen enthalten keine vertraulichen Druckdaten
- Antworten per E-Mail optional über eindeutige Projektadressen zuordnen

## 6. Kundenbranding

- Logo in einem sicheren Objektspeicher ablegen
- Bildformate, Dateigröße und Schadcode prüfen
- Farbwerte auf gültige Formate und ausreichende Kontraste prüfen
- Branding bleibt kundenspezifisch; „betreut von druckkultur“ bleibt sichtbar

## 7. Dateien und Freigaben

- große PDF- und Druckdateien nicht in der relationalen Datenbank speichern
- Objektspeicher mit zeitlich begrenzten Download-Links verwenden
- Virenscan und Dateitypprüfung vor Freigabe
- Versionen eindeutig kennzeichnen
- Freigaben mit Benutzer, Zeitpunkt, Version, Kommentar und IP-/Sitzungsreferenz protokollieren
- alte Versionen dürfen nicht versehentlich erneut freigegeben werden

## 8. Mitarbeiter-Cockpit

- Firmenliste mit Ungelesen-Zähler und offenen Entscheidungen
- Filter nach eigener Zuständigkeit, Vertretung und Dringlichkeit
- neue Vorgänge anderer Firmen bleiben beim Firmenwechsel sichtbar
- feste Reaktionsregeln und Eskalation bei unbeantworteten Nachrichten
- keine künstliche „Live-Chat“-Erwartung ohne besetztes Team erzeugen

## 9. Integration

- Leseschnittstelle zur bestehenden Auftragsübersicht und Plantafel
- kundenrelevante Statuswerte aus internen Statuswerten ableiten
- Angebote, Auftragsbestätigungen und Lieferscheine automatisch zuordnen
- später PPWR-, EUDR- und Materialdokumente bereitstellen
- Änderungen möglichst nur in einem führenden System pflegen

## 10. Pilotkennzahlen

- Zeit bis zur ersten persönlichen Reaktion
- Anzahl ungeklärter Nachrichten je Firma
- Anteil digitaler Freigaben
- Zahl falscher Dateiversionen
- vermiedene Statusanfragen per Telefon oder E-Mail
- Nutzung durch Teamleiter und eingeschränkte Benutzer
- subjektiver Nutzen für Kunde und druckkultur-Team
