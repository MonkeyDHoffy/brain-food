# PROJEKTBRIEF UND STARTPROMPT – BRAIN FOOD
## Reverse Engineering mit KI als gamifizierte Browser-Präsentation

Du bist Claude Code und sollst aus diesem Paket eine kurze, stabile, gamifizierte Präsentation bauen. **Lies dieses Dokument, `02_Sprechtext/Sprechtext-abgestimmt.txt`, `02_Sprechtext/content.json` und die drei nummerierten Wireframes in `03_Wireframes/`.** Das sind die vollständigen aktuellen Vorgaben. Es gibt hier absichtlich keine alten Entwürfe.

## Ziel

Baue ein kleines 2D-Browsergame als Präsentation für höchstens fünf Minuten. Startbildschirm mit auswählbarem Eintrag **„Level 1: Reverse Engineering mit KI“**. Die Spielfigur führt das Publikum durch drei Bildschirme. Sie spricht in einer gut lesbaren Sprechblase; derselbe Satz wird unten im Präsentationsfenster/Untertitelbereich gezeigt. Der Nutzer spricht die vier Audios selbst ein und liefert sie ggf. später nach.

## Das vereinbarte Erlebnis

### Startbildschirm
- Brain Food; Menüeintrag „Level 1: Reverse Engineering mit KI“.
- Nach Auswahl: „Manuell spielen“ oder „Autopilot starten“. Beide Modi jederzeit pausierbar.
- Audio startet erst nach einer bewussten Nutzeraktion.

### Bildschirm 1 – Spielefusionen
- Retro-Pixel-Spielfeld; Figur beginnt beim Mikrofon.
- E oder Klick am Mikrofon startet die Einstiegssequenz.
- Im Fenster darunter ploppen zwei bis drei austauschbare Beispielbilder mit kurzen Bildunterschriften nacheinander auf. Die Beispiele sollen erkennbar verschiedene Spiele/Spielwelten/Mechaniken mixen; Spielnamen nur in Bildunterschriften.
- Danach geht die Figur durch die Tür zu Bildschirm 2.
- Wireframe: `03_Wireframes/01-Bildschirm-1-Spielefusionen.png`.

### Bildschirm 2 – Kompilieren, Dekompilieren, Clean Room
- Zwei klar beschriftete Sprung-Buttons: **1 Kompilieren** und **2 Dekompilieren**.
- Sprung auf Button 1 startet die Kompilier-Animation und Sequenz `02-compile`: lesbarer C-Quellcode → Compiler → symbolische Maschinensprache (Nullen/Einsen). Zeige keine falsche Gleichsetzung mit Verschlüsselung: Kompilieren ist kein garantierter Kopierschutz.
- Wenn Sequenz/Animation fertig ist, geht die Figur zu Button 2. Im manuellen Modus wartet sie auf den Sprung; im Autopilot geht sie sichtbar dorthin.
- Sprung auf Button 2 startet die Dekompilier-Animation und Sequenz `03-decompile-cleanroom`: Maschinencode → rekonstruierter, lesbarer Code. Der Code ist nicht der ursprüngliche Quellcode.
- Anschließend innerhalb dieser Sequenz Clean Room einfach abgrenzen: **Verhalten beobachten → Funktionen beschreiben → getrennt eigenes Programm schreiben.** Clean Room ist ein organisatorischer Ansatz zur Trennung von Analyse und Umsetzung – keine dritte Compiler-Methode und keine Rechtmäßigkeitsgarantie.
- Danach öffnet sich die Tür zu Bildschirm 3.
- Wireframe: `03_Wireframes/02-Bildschirm-2-Kompilieren-Dekompilieren.png`. Das dritte Wireframe illustriert ArtCraft/Clean-Room-/Rechts-Einordnung und ist keine zusätzliche Bildschirmfolge.

### Bildschirm 3 – ArtCraft und Ausblick
- ArtCraft-Button startet Sequenz `04-artcraft-outlook`.
- Präsentationsfenster zeigt als austauschbare Slots eine Übersicht der sieben Adobe-bezogenen Nachbau-Projekte und ein PhotoCraft-Beispiel. Diese konkreten Belegbilder sind noch nicht vorhanden; bis dahin klar markierte Platzhalter.
- Keine Behauptung, die komplette Adobe-Bibliothek sei kopiert oder die Projekte seien fertige professionelle Vollersatzprodukte. Clean-Room-Ansatz als Entwicklerangabe kennzeichnen. Rechtsfrage vorsichtig und kurz halten.
- Abschluss mit dem offenen Gedanken aus dem vereinbarten Text.
- Wireframe: `03_Wireframes/03-Bildschirm-3-ArtCraft-Clean-Room-Ausblick.png`.

## Interaktion und Spielmodi
- Manuell: A/D oder Pfeiltasten bewegen, Leertaste springen, E interagieren; alles zusätzlich per Klick bedienbar.
- Autopilot: dieselbe Figur läuft auf einfachen festen Wegen und löst dieselben Aktionen/Sequenzen aus. Jederzeit Pause/Fortsetzen; Weiter/Überspringen möglich.
- Figurensprünge sind einfache Wegpunkt-Animationen, keine präzise Plattformphysik. Keine Gegner, Inventare, Punkte, Multiplayer, Spielstände oder zusätzlichen Level.
- Beim Wechsel/Sprung zu einer neuen Sequenz alte Audiodatei zuverlässig stoppen oder pausieren; nie zwei Aufnahmen gleichzeitig.

## Sprechtext, Audio und Platzhalter
- Der abgestimmte Wortlaut steht in `02_Sprechtext/Sprechtext-abgestimmt.txt`; strukturiert zusätzlich in `02_Sprechtext/content.json`. Übernimm ihn unverändert, Satz für Satz.
- Vier selbst eingesprochene Audio-Dateien sind später vorgesehen: `01-intro.mp3`, `02-compile.mp3`, `03-decompile-cleanroom.mp3`, `04-artcraft-outlook.mp3`. Sie sind aktuell nicht enthalten.
- Solange Audio fehlt, muss alles im Textmodus vollständig abspielbar sein. Keine TTS/Browser-Sprachausgabe. Sprechblasen sollen kurze, gut lesbare Satzabschnitte zeigen. Audio-/Untertitel-Sync später über editierbare Zeitmarken oder robuste manuelle Steuerung ermöglichen.
- Beispielbilder sind ebenfalls noch nicht final. Erstelle klare, austauschbare Platzhalter mit Bildunterschrift/Credit-Feld; verwende keine zufälligen Webbilder oder erfundenen Screenshots als Tatsachenbeleg.
- ArtCraft/PhotoCraft-Dateinamen können sein: `artcraft-apps.*`, `photocraft-demo.*`; Spielefusionen: `fusion-01.*`, `fusion-02.*`, optional `fusion-03.*`.

## Inhaltliche Leitplanken
- Nicht alle Spielefusionen sind KI-generiert oder durch Dekompilierung entstanden. Unterschiedliche technische Ansätze unterscheiden.
- Reverse Engineering heißt, fertige Software zu untersuchen, um ihre Funktionsweise zu verstehen. Dekompilieren ist ein möglicher Weg; rekonstruierter Code ist nicht Original-Quellcode.
- KI kann Analyse, Verständnis und Programmierarbeit erleichtern/beschleunigen; keinen pauschalen Faktor behaupten.
- ArtCraft-Angaben als Projekt-/Entwicklerangaben markieren. Keine Aussage, dass ein Gericht den Clean-Room-Prozess bewertet hat. Keine Rechtsberatung.
- Genauigkeit und die vereinbarten Sprechtexte haben Vorrang vor zusätzlichen Effekten oder neuen Inhalten.

## Technik, Hosting und Zeitbudget
- Ziel: `https://brainfood.hoffja.de`. Prüfe zuerst den tatsächlichen Projektordner, Repository-Anweisungen, Server- und Docker-/Reverse-Proxy-Weg. **Nichts über die bestehende Umgebung erraten.**
- Vor produktiven Änderungen sichern und den einfachen Rollback dokumentieren. Nur nötige Änderungen an dieser Subdomain; andere Sites/Container nicht anfassen. Zugangsschutz für Seite sowie Bilder/Audios erhalten. Keine Zugangsdaten ins Repository schreiben.
- Priorität bei ca. zehn Stunden: (1) stabile drei Bildschirme und Text, (2) Trigger/Animationen und manuelle Steuerung, (3) Autopilot/Pause, (4) Einbau der später gelieferten Medien, (5) visuelle Extras.
- Zielpräsentation unter fünf Minuten; der Text umfasst rund 504 Wörter. Reale Dauer nach Aufnahme und Bewegung testen.
- Liefere zunächst eine lauffähige lokale Preview und eine kurze Statusmeldung: was läuft, was fehlt, wie testen, welche Änderungen fürs Deployment nötig sind. Nichts unsicher live stellen.

## Definition of Done
- Startmenü und drei Bildschirme funktionieren, jeweils mit den beschriebenen Triggern.
- Manuell und Autopilot; Pause/Fortsetzen; Tastatur und Klick.
- Ohne Audio/Bilder keine Fehler, sondern vollständiger Textmodus und saubere Platzhalter.
- Sprechtext entspricht exakt der TXT/JSON-Fassung.
- Responsiv und gut lesbar; reduzierte Bewegung respektieren; Fokuszustände vorhanden.
- Kein ungewolltes Ändern anderer Services; Hosting-/Zugriffsschutz geprüft.

## Beginne jetzt

1. Prüfe die vorhandene Projekt-/Serverumgebung und melde knapp deinen Umsetzungsplan, ohne erst eine lange Rückfragerunde zu starten.
2. Baue den kleinsten vollständigen Prototyp nach den Dateien in diesem Paket.
3. Halte offene Risiken/fehlende Medien separat fest und schlage nur sinnvolle kleine Verbesserungen vor.
