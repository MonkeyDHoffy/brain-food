# Brain Food – Reverse Engineering mit KI

Eine gamifizierte Präsentation als kleines Pixel-Jump'n'Run. Eine Figur mit Fotokopf führt in drei Räumen
durch das Thema KI-gestütztes Reverse Engineering. Was sie auslöst, erscheint unten auf der Präsentationsfläche.

- Plan und Meilensteine: [docs/UMSETZUNGSPLAN.md](docs/UMSETZUNGSPLAN.md)
- **Aktueller Stand, Bedienung, offene Punkte: [docs/STATUS.md](docs/STATUS.md)**
- Audios und Zeitmarken, Texte und Bilder tauschen: [docs/MEDIEN-UND-TIMING.md](docs/MEDIEN-UND-TIMING.md)
- Entscheidungen: [docs/ENTSCHEIDUNGEN.md](docs/ENTSCHEIDUNGEN.md) · Betrieb: [betrieb/brainfood-web/README.md](betrieb/brainfood-web/README.md)
- Live: https://brainfood.hoffja.de (Passwort in `.zugang.local.txt`)
- Vorgaben (Brief, Sprechtext, Wireframes): [vorgaben/](vorgaben/)

## Starten

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # statischer Build nach dist/
npm test           # Playwright-Tests (9)
```

Nützliche Adressen im Dev-Server: `/?timing` (Timing-Rekorder), `/face.html` (Kopf- und Körper-Vorschau),
`/?room=2&auto=1&speed=3` (Direkteinstieg, Autopilot, 3-fach schnell).

```bash
tools\Online-aktualisieren.cmd   # bauen + live einspielen
```
