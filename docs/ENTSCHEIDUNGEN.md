# Entscheidungen

| # | Datum | Entscheidung | Warum |
|---|---|---|---|
| E1 | 14.10. | **Vite und Vanilla JS statt Godot oder Phaser** | Einmalige Browser-Präsentation. Lädt sofort, Text bleibt als HTML scharf, kleiner Build (~37 KB JS gzip) und schnelle Änderungen. |
| E2 | 14.10. | **Feste 16:9-Bühne (1920×1080), per CSS skaliert** | Teams-Stream, Bürobildschirm und Laptop zeigen exakt dasselbe Layout. |
| E3 | 14.10. | **Spielfeld als Canvas mit 480×114 Pixeln, Kopf in voller Auflösung** | Echter Pixel-Look für Welt und Körper. Der Fotokopf bleibt scharf, der Kontrast ist Teil des South-Park-Gags. |
| E4 | 14.10. | **Kopf aus `lower_jaw.png` (A4) und `header_upper.png` per Bildabgleich am Originalfoto ausgerichtet** (`tools/align_head.py`) | Die neuere Kieferdatei ist sauberer freigestellt, liegt aber auf einer anderen Fläche. |
| E5 | 14.10. | **Raum 2: Satz 1 beim Betreten, danach wartet die Figur auf den Sprung** | Wunsch: Die Figur kündigt den Compiler an, dann wird gesprungen. Gilt mit Audio genauso, die Aufnahme pausiert nach Satz 1. |
| E6 | 14.10. | **Raum 3 mit einem Knopf (ArtCraft)**, die Präsentationsfläche wechselt satzgenau durch ArtCraft → Ausblick → Recht → Schluss | Der Brief sieht einen Button und eine Sequenz vor. Das Wireframe mit drei Buttons war Illustration. |
| E7 | 14.10. | **Vier Fusionsbilder statt drei** | Die Skizze zeigt 4 Plätze, und der Satz „Figuren, Spielwelten, bewegen, bauen, kämpfen“ lässt sich auf die 4 Beispiele verteilen. |
| E8 | 14.10. | **ArtCraft-Übersicht als Kacheln mit offiziellen Icons** statt Launcher-Screenshot | Im Stream lesbarer. Der Launcher-Screenshot zeigt außerdem Word, PowerPoint und Excel. Er liegt zugeschnitten bereit (`artcraft-apps.png`). |
| E9 | 14.10. | **Medienliste beim Build** (`virtual:media`) | Fehlende Audios erzeugen keine 404-Meldungen. Der Textmodus läuft ohne Fehler (Definition of Done). |
| E10 | 14.10. | **Deployment wie acorn**: eigener Container, Passwort im Container, Stände mit `current`-Link | Bewährtes Muster auf meinserver. Andere Sites bleiben unberührt, Rollback mit einem Befehl. |
| E11 | 14.10. | **Raum 2: erst Code schreiben, dann kompilieren** – die Figur tippt am Schreibtisch-PC den Quellcode („Ein Mensch schreibt Quellcode …“), danach „Ich starte den Compiler“ und der Sprung auf Knopf 1 | Wunsch: Man sieht, dass ein Mensch den Code geschrieben hat, bevor er kompiliert wird. Die beiden Sätze sind dafür getauscht (Text, Aufnahmen und Lippen-Kurven), neu eingesprochen werden musste nichts. |
| E12 | 14.10. | **Stimmfilter live im Browser statt neu gerenderter Dateien** – abschaltbar (Taste V), standardmäßig an (Wunsch 14.10.) | Die Originalaufnahmen bleiben unangetastet, man kann während des Vortrags A/B vergleichen. Abgestimmt auf eine Messung der Aufnahmen (Terzbänder gegen typische Sprache): Wärme um 200 Hz +3 dB, harter Bereich 2–6 kHz −2 bis −3 dB, sanfte Kompression, Hauch Raum, Lautstärke angeglichen (±0,1 dB). |
| E13 | 14.10. | **Untertitel standardmäßig aus, eingeschaltet auf Englisch** (`src/data/subtitles-en.json`) | Wunsch: Die Sprechblase zeigt den deutschen Text ohnehin; die Untertitel dienen jetzt Kolleginnen und Kollegen, die lieber Englisch lesen. Der Test prüft, dass jeder Satz eine englische Fassung hat. |
