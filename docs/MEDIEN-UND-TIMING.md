# Medien austauschen und Audio synchronisieren

## Aufnehmen mit dem Aufnahme-Studio (empfohlen, ab v2)

1. Auf `tools\Aufnahme-Studio.cmd` doppelklicken. Das öffnet `http://localhost:5173/studio.html`.
2. Jeden Satz einsprechen: **Leertaste** startet und stoppt, **Enter** spielt ab, **↑ ↓** wechselt den Satz. Gespeichert wird sofort in `aufnahmen\<abschnitt>\<nr>.webm` (nicht im Git).
3. Wenn alles passt: **„Alles eingesprochen – OK“**.
4. Einbauen: `node tools/audio-einbauen.mjs`. Das schneidet Stille weg, gleicht die Lautstärke an, legt `public/media/audio/<abschnitt>/<nr>.mp3` an und berechnet die Mundbewegung (`src/data/lipsync.json`). `--alle` baut alles neu.
5. Das Spiel spielt dann Satz für Satz ab. Zeitmarken braucht es nicht. Pausen zwischen den Sätzen stellst du in `src/data/pacing.json` ein (`gapMs` als Standard, `after` für einzelne Sätze).

## Audios einbauen (alte Variante: eine Datei pro Abschnitt)

1. Lege die vier selbst eingesprochenen Dateien unter genau diesen Namen ab:

   | Datei | Sequenz | Auslöser |
   |---|---|---|
   | `public/media/audio/01-intro.mp3` | Raum 1, Einstieg | E am Mikrofon |
   | `public/media/audio/02-compile.mp3` | Raum 2, Kompilieren | Satz 1 beim Betreten, Rest nach dem Sprung auf Knopf 1 |
   | `public/media/audio/03-decompile-cleanroom.mp3` | Raum 2, Dekompilieren und Clean Room | Sprung auf Knopf 2 |
   | `public/media/audio/04-artcraft-outlook.mp3` | Raum 3, ArtCraft und Ausblick | Sprung auf den ArtCraft-Knopf |
   | `public/media/audio/03b-gag-jannik.mp3` *(optional)* | Raum 2, Gag: „Und genau so habe ich, Jannik, mich übrigens auch dekompiliert – und in dieses Spiel eingebaut. 😉“ | direkt nach „… lassen sich in ein anderes Spiel einbauen.“ |

   Der Gag steht in `src/data/extras.json`, nicht im abgestimmten Sprechtext. Die Aufnahme 03 hält nach Satz 5 an, dann läuft der Gag, danach geht 03 weiter.

2. Mehr ist nicht nötig. Liegt eine Datei vor, spielt das Spiel sie ab und bewegt den Mund im Takt der Lautstärke. Ohne Zeitmarken teilt es die Sätze nach Textlänge auf. Das passt grob.

3. Für exakte Untertitel nimmst du Zeitmarken auf:
   - Dev-Server starten (`npm run dev`) und `http://localhost:5173/?timing` öffnen.
   - Sequenz wählen und auf **Aufnehmen** klicken. Bei **jedem Satzanfang die Leertaste** drücken, auch beim ersten Satz.
   - Mit **Testen** prüfen: Der aktuelle Satz wird beim Abspielen hervorgehoben.
   - Das Ergebnis wird sofort in diesem Browser genutzt. Damit es dauerhaft gilt, kopierst du es mit **JSON kopieren** in `src/data/timings.json`, zum Beispiel `"01-intro": [0.4, 9.8, 17.2, …]`.

> In Raum 2 tippt die Figur während Satz 1 („Ein Mensch schreibt Quellcode …“) am PC. Nach Satz 2 („Ich starte den Compiler.“) wartet sie auf den Sprung. Nachträgliche Schnitte in einzelnen Aufnahmen stehen in `tools/schnitte.json`.

## Texte ändern

- Sprechtext: `src/data/content.json` (Satz für Satz). Der Test `npm test` prüft, ob die Kopie mit `vorgaben/02_Sprechtext/content.json` übereinstimmt. Bei einer gewollten Änderung passt du beide Dateien an.
- Wann welche Animation läuft: `src/story/script.js`. Die Cues haben die Form `[satzIndex, anteil, funktion]`. `at(seq, satz, 'Wort')` setzt den Zeitpunkt auf das Wort im Satz, so passen die Cues auch nach kleinen Textänderungen noch.
- Texte auf der Präsentationsfläche: `src/pres/r1.js`, `r2.js`, `r3.js`.

## Bilder

| Datei in `public/media/images/` | Inhalt | Beschriftung in |
|---|---|---|
| `fusion-01.jpg` … `fusion-04.webp` | Spielefusionen (Raum 1) | `src/data/media.js` → `FUSIONS` |
| `photocraft-demo.jpg` | PhotoCraft-Oberfläche (Raum 3) | `ARTCRAFT` |
| `artcraft-icon-*.png` | offizielle App-Icons der Crafting Apps | `ARTCRAFT_APPS` |
| `artcraft-apps.png` | Launcher-Übersicht (auf die 7 Adobe-Apps zugeschnitten, aktuell nicht eingeblendet) | – |

Fehlt eine Datei, erscheint automatisch ein beschrifteter Platzhalter. Quellen für den Abspann stehen in `SOURCES`.

## Ton

- Musik: `public/media/music/loop.mp3` („Bossa Nova“ von Joth, CC0). Mit **M** schaltest du sie aus. Sie wird automatisch leiser, solange gesprochen wird.
- Geräusche: `public/media/sfx/*.mp3` (Kenney, CC0). Die Lautstärken stehen in `src/engine/audio.js` (`SFX`, `MUSIC_VOL`).
- Herkunft aller Audiodateien: `public/media/CREDITS-AUDIO.json`.
