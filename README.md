# IkigAI Data-Driven V1.2

Neue Features:
- Tagesenergie im Profil: Morgen / Neutral / Abend
- Arbeitsort-Empfehlung für Arbeitstermine
- Ziele sind mit Terminen verbunden und zeigen Fortschritt
- Simulierte Wetterintegration via `data/weather.json`
- Reisezeiten/Puffer werden zwischen Ortswechseln automatisch angezeigt
- Bestehende KI-Zeitvorschläge bleiben erhalten

GitHub Pages:
1. ZIP entpacken
2. Inhalt in Repository hochladen
3. Settings > Pages > Deploy from branch > main / root


## Neu in V1.3
- Neuer-Termin-Button auf Home, Arbeit und Freizeit
- iOS Bottom-Sheet Formular
- Neue Termine werden lokal im Browser gespeichert (`localStorage`)
- Startzeit ist optional
- Ohne Startzeit vergibt IkigAI automatisch einen KI-Zeitvorschlag


## Fix in V1.3.1
- Der Button `Neuer Termin` ist jetzt zusätzlich als große blaue Karte direkt im Inhalt sichtbar.
- Der Floating Button wurde nach rechts unten fixiert.


## Neu in V1.4
- Profilseite mit persönlichen Angaben
- Vorname, Nachname, Email, Telefonnummer, Alter, Geschlecht
- Private Adresse und Geschäftsadresse
- Arbeitsstunden pro Woche
- Auswahl der Arbeitstage
- Speicherung im Browser via `localStorage`


## Neu in V1.5
- Kategorien im Profil priorisieren
- Prioritäten beeinflussen KI-Zeitvorschläge
- Konfliktprüfung beim Erfassen neuer Termine
- Warnung bei Überschneidungen
- Optionen: Zeit anpassen oder trotzdem speichern
