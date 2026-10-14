# Medien austauschen und Audio synchronisieren

## Audios einbauen

1. Lege die vier selbst eingesprochenen Dateien unter genau diesen Namen ab:

   | Datei | Sequenz | Auslöser |
   |---|---|---|
   | `public/media/audio/01-intro.mp3` | Raum 1, Einstieg | E am Mikrofon |
   | `public/media/audio/02-compile.mp3` | Raum 2, Kompilieren | Satz 1 beim Betreten, Rest nach dem Sprung auf Knopf 1 |
   | `public/media/audio/03-decompile-cleanroom.mp3` | Raum 2, Dekompilieren und Clean Room | Sprung auf Knopf 2 |
   | `public/media/audio/04-artcraft-outlook.mp3` | Raum 3, ArtCraft und Ausblick | Sprung auf den ArtCraft-Knopf |

2. Mehr ist nicht nötig. Liegt eine Datei vor, spielt das Spiel sie ab und bewegt den Mund im Takt der Lautstärke. Ohne Zeitmarken teilt es die Sätze nach Textlänge auf. Das passt grob.

3. Für exakte Untertitel nimmst du Zeitmarken auf:
   - Dev-Server starten (`npm run dev`) und `http://localhost:5173/?timing` öffnen.
   - Sequenz wählen und auf **Aufnehmen** klicken. Bei **jedem Satzanfang die Leertaste** drücken, auch beim ersten Satz.
   - Mit **Testen** prüfen: Der aktuelle Satz wird beim Abspielen hervorgehoben.
   - Das Ergebnis wird sofort in diesem Browser genutzt. Damit es dauerhaft gilt, kopierst du es mit **JSON kopieren** in `src/data/timings.json`, zum Beispiel `"01-intro": [0.4, 9.8, 17.2, …]`.

> In Raum 2 hält die Aufnahme `02-compile.mp3` nach Satz 1 an („Ich starte den Compiler – schaut nach links.“) und wartet auf den Sprung. Lass nach diesem Satz beim Einsprechen eine kurze Pause.

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
