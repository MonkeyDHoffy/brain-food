# Status – Stand 15.10.2026, früh morgens

## Kurz gesagt

Die Präsentation läuft komplett: Bootscreen → Menü → drei Räume → Abspann, manuell und per Autopilot.
Die Sätze kommen wortgleich aus dem abgestimmten Sprechtext. Ohne Audio läuft alles im Textmodus, ohne Fehler.
Live unter **https://brainfood.hoffja.de** (Passwortschutz, Zugang siehe unten). 9 automatische Tests sind grün.

## So präsentierst du

1. `https://brainfood.hoffja.de` im Browser öffnen, anmelden und **F** für Vollbild drücken.
2. **EINSCHALTEN** klicken (erst dann darf der Browser Ton abspielen) → Level 1 → **Manuell spielen** oder **Autopilot starten**.
3. In Teams den **ganzen Bildschirm** teilen und **Computerton freigeben** einschalten. Lass das Browserfenster im Vordergrund. Wird es verdeckt oder minimiert, pausiert das Spiel automatisch.

| Taste | Funktion |
|---|---|
| A / D (← →) | laufen |
| Leertaste (W, ↑) | springen, auf die Knöpfe springen |
| E | Mikrofon, Tür |
| N | nächster Satz. Spricht niemand, führt N die anstehende Aktion aus (Figur läuft hin) |
| Shift+N | ganzen Abschnitt überspringen |
| P / Esc | Pause (im Pausemenü: R Raum neu, O Autopilot) |
| O | Autopilot an/aus. Ein Tastendruck auf A/D übernimmt sofort manuell |
| M / U / G / K | Musik / Untertitel / Kulleraugen und Brauen / Körper (Strick, Hoodie, Klassik) |
| 1 2 3 | Notfall: Raum direkt starten |
| F / H | Vollbild / Hilfe |

Mikrofon, Knöpfe und Tür kannst du auch **anklicken**, dann läuft die Figur selbst hin.
Bedienleiste und Mauszeiger blenden sich nach 2,5 s Mausruhe aus.

## Was fertig ist

- **Raum 1 (Spielefusionen):** Mikrofon mit E, Agenda leuchtet satzgenau auf, 4 Fusionsbilder mit recherchierten Bildunterschriften und Quellen. Danach Definition Reverse Engineering, die Rolle der KI und die Tür.
- **Raum 2 (Compiler-Labor):** Satz 1 beim Betreten, dann der Sprung auf Knopf 1. Die Figur zerfällt in Bits. Quellcode tippt sich, Maschinencode (echte x86-Bytes), „ausgeliefert“. Sprung auf Knopf 2: rekonstruierter Code („nicht das Original“), KI-Annotation, Mechanik-Transfer zwischen zwei Mini-Spielen, **Jannik-Gag** mit Zwinkern, Spiele-Brücke, Clean-Room-Diagramm mit Trennwand.
- **Raum 3 (Software-Atelier):** ArtCraft-Knopf, die 7 „Craft Apps“ mit offiziellen Icons zählen hoch, PhotoCraft-Screenshot, „laut Entwicklern: Clean Room“ und „laut Projekt: kein Vollersatz“. Dann Ausblick, Recht (Nachbauen ≠ Kopieren, keine Rechtsberatung), offene Frage, Schlussgedanke.
- **Extras:** Retro-Bootscreen, Glitch-Türwechsel, Figur wird kompiliert, Level-Complete-Abspann mit animiertem Kopf und Quellen, dazu 64-Bit-Körper (Strick als Standard, Hoodie, Klassik).
- **Kopf:** dein Foto mit Klappmund im South-Park-Stil, Kulleraugen mit Trägheit, Blinzeln, dicke Brauen mit Gesten. Mit Audio steuert die Lautstärke den Mund.
- **Ton:** dezente CC0-Geräusche und eine 8-Bit-Bossa-Nova. Die Musik wird beim Sprechen leiser.
- **Werkzeuge:** Timing-Rekorder (`/?timing`), Kopf-Vorschau (`/face.html`, nur lokal), Live-Check (`node tools/live-check.mjs`), Upload per Doppelklick (`tools\Online-aktualisieren.cmd`).

## Was fehlt (für heute gemeinsam)

1. **Audios** (4 Dateien + optional der Gag) einlegen und die Zeitmarken mit `?timing` aufnehmen. Die Anleitung steht in [MEDIEN-UND-TIMING.md](MEDIEN-UND-TIMING.md). Danach im echten Browser kurz prüfen, ob der Mund zur Stimme klappt. Das konnte ich nur mit einer künstlichen Testdatei prüfen: Abspielen, Pause, N und Satzwechsel funktionieren.
2. **Texte** gemeinsam anpassen. Danach die Cues in `src/story/script.js` kurz gegenchecken.
3. **Bilder und Bildunterschriften** bestätigen, vor allem die Herkunftsangaben in `src/data/media.js`.
4. **Körper auswählen:** Strick, Hoodie oder Klassik. Danach setze ich den Standard fest.
5. Generalprobe über Teams.

## Bewusste Entscheidungen und Abweichungen

- In Raum 2 spricht die Figur Satz 1 schon beim Betreten und wartet dann auf den Sprung. Das war dein Wunsch, der Brief sah den Start erst beim Sprung vor.
- Der Gag steht nicht im 504-Wörter-Text, sondern in `src/data/extras.json` mit eigener Audiodatei.
- Die ArtCraft-Übersicht ist eine Kachelliste mit den offiziellen Icons statt des Launcher-Screenshots, weil sie im Stream lesbarer ist (Screenshot liegt bereit).
- Weitere Punkte stehen in [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md).

## Inhaltliche Hinweise aus der Recherche (für die Fragerunde)

- ArtCraft umfasst inzwischen **13 Apps**, auch Nachbauten von Word, PowerPoint, Excel, Pro Tools, AutoCAD und Figma. „Sieben Adobe-Anwendungen“ bleibt trotzdem korrekt.
- PhotoCraft hat laut eigener Doku eine installierte Photoshop-Kopie untersucht, ohne sie zu starten: Tastenkürzel-Datei, Presets, „strings in the main binary“. Spannend für die Frage, ob der Clean-Room-Prozess einer Prüfung standhält.
- Mario × Elden Ring baut auf der **Super-Mario-64-Dekompilierung** auf (libsm64). Das ist ein direkter Bezug zum Thema Dekompilieren.
- Das Skate-3-×-MW2-Projekt nennt **Ghidra** (Reverse Engineering) und KI-Coding-Werkzeuge in seinen READMEs.

## Betrieb

- Server: Container `brainfood-web` unter `/opt/brainfood` auf meinserver. Andere Sites wurden nicht angefasst.
- Zugang: Benutzer `brainfood`, das Passwort steht in **`.zugang.local.txt`** im Projektordner. Die Datei ist nicht im Repo.
- Aktualisieren: `tools\Online-aktualisieren.cmd`. Rollback: `ssh meinserver "sh /opt/brainfood/deploy.sh --zurueck"`.
- **Gesicherte Fassung v1:** Git-Tag `v1.0`, GitHub-Release mit Build, Server-Kopie `/opt/brainfood/site/v1`. Notfall: `tools\Zurueck-zu-v1.cmd`.
- Repo: https://github.com/MonkeyDHoffy/brain-food (privat).
