# Umsetzungsplan – Brain Food: Reverse Engineering mit KI

Stand: 14.10.2026, Nachtschicht. Vortrag: Donnerstag 15.10.2026 über Teams
(Büro auf großem Bildschirm, weitere Leute am eigenen PC).

## Zielbild

Eine gamifizierte Präsentation als kleines Pixel-Jump'n'Run im Browser, höchstens fünf Minuten lang.
Oben liegt das **Spielfeld**: Eine Figur mit Pixel-Körper und Fotokopf läuft, springt und redet.
Der Kopf ist zwischen Ober- und Unterlippe geteilt, beim Reden klappt der Oberkopf wie bei den
South-Park-Kanadiern. Dazu kommen animierte Kulleraugen. Unten liegt die **Präsentationsfläche**: Sie
zeigt, was die Figur auslöst, also Bilder, die Compiler-Animation, Diagramme und Aussagen.
Am Ende jedes Raums führt eine Tür in den nächsten.

Quelle der Wahrheit sind `vorgaben/01_PROJEKTBRIEF-UND-STARTPROMPT.md`, der Sprechtext
`vorgaben/02_Sprechtext/*` (wörtlich, 504 Wörter) und die Wireframes in `vorgaben/03_Wireframes/`.
Die ältere Layoutvorlage (`vorgaben/layoutvorlage-alt.html`, 4 Folien) dient nur als Farb- und Stimmungsreferenz.

## Ablauf

| Raum | Auslöser | Sequenz | Präsentationsfläche |
|---|---|---|---|
| Start | Retro-Bootscreen „BRAIN FOOD OS“ → Level-Auswahl → Manuell / Autopilot | – | – |
| 1 Spielefusionen | Figur geht zum Mikrofon, **E** (oder Klick) | `01-intro` | Überschrift → 4 Fusionsbilder ploppen nacheinander auf → Kernbegriffe → Tür öffnet |
| 2 Compiler-Labor | Betreten: Figur tippt am PC (Satz 1 „Ein Mensch schreibt Quellcode …“), Satz 2 („Ich starte den Compiler …“) → Pfeil über Button 1 → **Sprung** | `02-compile` | Quellcode erscheint beim Tippen → Compiler → Bits → „nur Maschinencode ausgeliefert“ |
| 2 | Pfeil über Button 2 → **Sprung** | `03-decompile-cleanroom` | Bits → rekonstruierter Code → KI-Annotation → Mechanik-Transfer → Clean Room (zwei Teams, Trennwand) → Tür |
| 3 Software-Atelier | Pfeil über ArtCraft-Button → **Sprung** | `04-artcraft-outlook` | App-Übersicht → PhotoCraft → „laut Entwicklern: Clean Room“ → Ausblick → Recht → offener Schlussgedanke |
| Ende | Tür → Level-Complete-Abspann | – | Gag-Statistik, Quellen und Credits, Neustart |

## Technik

- **Vite + Vanilla JS**, keine schwere Engine. Der statische Build läuft auf jedem Webserver.
- **Bühne mit fester Größe** (1920×1080, 16:9), skaliert per CSS auf jedes Fenster. So sieht es im Teams-Stream, auf dem Bürobildschirm und am Laptop gleich aus.
- **Spielfeld:** ein Canvas. Die Pixelwelt wird in niedriger Auflösung (480×112) gerendert und ohne Glättung hochskaliert. Fotokopf, Kulleraugen und Effekte zeichne ich danach in voller Auflösung.
- **Präsentation, Sprechblase, Untertitel und HUD** sind HTML/CSS, damit der Text scharf und barrierearm bleibt.
- **Ablauf-Engine:** Jeder Raum ist ein kleines Skript (async), mit `say()` für Sätze, `trigger()` für Mikrofon, Buttons und Tür und Cues für die Präsentation. Manuell und Autopilot nutzen dasselbe Skript. Im Autopilot führt ein Steuer-Skript die Figur.
- **Audio:** Pro Sequenz eine MP3 mit Satz-Zeitmarken (`src/data/timings.json`). Fehlt die Datei, läuft der Textmodus mit Lesezeiten. Fehlen nur die Zeitmarken, werden sie aus der Textlänge geschätzt. Ein **Timing-Rekorder** (`?timing`) nimmt die Zeitmarken per Tastendruck auf.
- **Lippensync:** Mit Audio steuert die Lautstärke der Aufnahme (Web Audio Analyser) das Klappen des Oberkopfs. Ohne Audio klappt er im Silbenrhythmus.
- **Deployment:** eigener Container `brainfood-web` (nginx:alpine) im Netz `webserver_default` hinter nginx-proxy und acme-companion, Muster wie `acorn`. Passwortschutz, noindex, Stände mit `current`-Link und Rollback.

## Meilensteine (je ein Commit)

| # | Inhalt | Ergebnis |
|---|---|---|
| M0 | Repo, Plan, Vorgaben, Vite-Gerüst | Repo privat auf GitHub |
| M1 | Bühne, Spielfeld-Renderer, Figur (Körper, Fotokopf-Rig, Kulleraugen), Steuerung, Physik | Figur läuft und springt in Raum 1 |
| M2 | Sprech- und Ablauf-Engine: Sätze, Sprechblase, Untertitel, Textmodus, Audio-Fallback, Pause/Weiter | Raum 1 spricht |
| M3 | Raum 1 komplett, Tür-Übergang (Glitch) | erster Raum vorführbar |
| M4 | Raum 2: Compile/Decompile, KI-Annotation, Mechanik-Transfer, Clean Room, „Figur wird kompiliert“ | Kernstück fertig |
| M5 | Raum 3 und Level-Complete-Abspann | ganzer Durchlauf |
| M6 | Bootscreen, Menü, Autopilot, Presenter-Tasten, Klicksteuerung | beide Modi |
| M7 | Sound, Musik, Feinschliff, reduzierte Bewegung, Fokus, Skalierung | vorführreif |
| M8 | Playwright-Tests (Autopilot komplett, manuelle Pfade, Pause), Review-Runde, Fixes | geprüft |
| M9 | Deployment brainfood.hoffja.de mit Passwort, Smoke-Test | online |
| M10 | Übergabe: `docs/STATUS.md`, Medien- und Timing-Anleitung | bereit für morgen |

Priorität bei Zeitknappheit laut Brief: (1) stabile Räume und Text → (2) Trigger, Animationen und manuelle
Steuerung → (3) Autopilot und Pause → (4) Medien → (5) visuelle Extras.

## Steuerung

| Taste | Funktion |
|---|---|
| A / D, ← / → | laufen |
| Leertaste (auch W / ↑) | springen |
| E | interagieren (Mikrofon, Tür) |
| P / Esc | Pause / Fortsetzen |
| N | nächster Satz (überspringen) |
| M | Musik an/aus |
| U | Untertitel an/aus |
| G | Kulleraugen und Brauen an/aus |
| K | Körper wechseln (Strick, Hoodie, Klassik) |
| Shift+N | ganzen Abschnitt überspringen |
| O | Autopilot an/aus (Tastendruck A/D übernimmt manuell) |
| 1 / 2 / 3 | Notfall: Raum direkt starten |
| F | Vollbild |
| H | Hilfe |

Alles ist zusätzlich per Klick bedienbar: Mikrofon, Buttons und Tür anklicken, die Figur läuft hin und löst aus.

## Inhaltliche Leitplanken (aus dem Brief)

- Sprechtext unverändert, Satz für Satz.
- Kompilieren ist keine Verschlüsselung und kein Kopierschutz. Darum gibt es kein Schloss-Symbol.
- Rekonstruierter Code ist nicht der Original-Quellcode, das wird sichtbar markiert.
- Nicht jede Spielefusion ist KI-generiert oder dekompiliert. Die Bildunterschriften behaupten keine Technik ohne Beleg.
- ArtCraft-Angaben sind als „laut Entwicklern“/„laut Projekt“ markiert. Es gibt keine Rechtsberatung und keine Aussage über Gerichtsurteile.
- Keine TTS, Audio startet erst nach einer Nutzeraktion. Nie laufen zwei Aufnahmen gleichzeitig.

## Für morgen gemeinsam

1. Audios einspielen (`public/media/audio/01-intro.mp3` …) und Zeitmarken mit `?timing` aufnehmen.
2. Texte bei Bedarf anpassen (`src/data/content.json`, Cues in `src/data/cues.js`).
3. Bildauswahl und Bildunterschriften final bestätigen.
4. Generalprobe über Teams (Bildschirm und Computerton freigeben).
