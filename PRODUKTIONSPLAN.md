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

## 11. Rückrufwünsche und Telefonintegration

- Telefonnummern im Benutzerprofil serverseitig speichern und formatieren
- Rückrufwunsch mit Firma, Kunde, Anlass, Zeitwunsch und zuständigem Mitarbeiter speichern
- Mitarbeiter-Popup zusätzlich über Push, Teams oder Desktop-Benachrichtigung auslösen
- offene Rückrufe in einer zentralen Warteschlange anzeigen
- Status `offen`, `angenommen`, `erledigt` und optional `nicht erreicht` vorsehen
- Klick auf „Anrufen“ über `tel:` oder die Schnittstelle der vorhandenen Telefonanlage auslösen
- Telefonate und kurze Gesprächsnotizen dem Kunden oder Projekt zuordnen
- Rückrufwünsche bei Abwesenheit automatisch an die Vertretung weitergeben

## 12. Dateiablage und Upload

Die Vorführversion verwendet IndexedDB im Browser. Im Produktivbetrieb:

- Upload direkt in einen geschützten Objektspeicher
- Größenlimits je Rolle und Dateityp
- Virenscan vor Freigabe für andere Benutzer
- Prüfsumme, Version und Uploader protokollieren
- zeitlich begrenzte Download-Links verwenden
- große Druck-PDFs mit unterbrochenen Uploads fortsetzen können
- Vorschaubilder und PDF-Seiten serverseitig erzeugen

## 13. Dokumentarten und Dokumentenworkflow

- Dokumentarten abhängig von Rolle und Projektschritt anbieten
- Kunden: Druckdaten, Anfrage, Bestellung, AB-Mahnung, Liefermahnung, Sonstiges
- druckkultur: Angebot, AB, Freigabedaten, Lieferschein, Sonstiges
- eigene Dokumentarten später administrierbar machen
- Dokumentart, Version, Uploader, Zeitpunkt und Sichtbarkeit serverseitig speichern
- Finanzdokumente nur für berechtigte Benutzer anzeigen
- neue Dokumente als Ereignis im Projektverlauf protokollieren

## 14. Bestell-PDF und KI-Auswertung

- PDF nur nach ausdrücklichem Upload des Benutzers analysieren
- API-Schlüssel ausschließlich serverseitig speichern
- erkannte Angaben nie ungeprüft verbindlich übernehmen
- Bestellnummer, Produkt, Menge, Format, Material, Termin und Besonderheiten extrahieren
- Unsicherheiten und leere Felder klar markieren
- Original-PDF dem Projekt als Bestellung zuordnen
- Datenschutzhinweis und Löschfristen für externe KI-Verarbeitung festlegen
- optional eigene lokale Dokumentenerkennung für besonders vertrauliche Kunden prüfen

## 15. Gesprächswünsche über Telefon und Teams

- Benutzerprofil enthält Telefonnummer und Teams-Konto
- Kunde wählt pro Anfrage den gewünschten Kontaktweg
- Mitarbeiter sieht Kontaktweg bereits im Popup
- Telefon über vorhandenes Softphone oder Telefonanlagen-API auslösen
- Teams über Deep Link oder Microsoft Graph anbinden
- Status offen, angenommen, nicht erreicht und erledigt vorsehen
