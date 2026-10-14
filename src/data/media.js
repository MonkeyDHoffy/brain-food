// Bilder, Bildunterschriften und Quellen. Dateien liegen in public/media/images/.
// Austauschen: Datei mit gleichem Namen ersetzen oder hier den Dateinamen ändern.
// Fehlt eine Datei, erscheint automatisch ein beschrifteter Platzhalter.

export const FUSIONS = [
  {
    file: 'fusion-01.jpg',
    title: 'Super Mario 64 × Elden Ring',
    sub: 'Mod: Mario mit Super-Mario-64-Steuerung im Bosskampf',
    tags: ['Figuren', 'Kämpfen'],
    credit: 'Mod „ER Mario“ (Deltaroo) · Bild: Esport1.hu',
  },
  {
    file: 'fusion-02.webp',
    title: 'Minecraft × GTA V',
    sub: 'Game Bridge: echtes Minecraft läuft mit und wird ins GTA-Bild eingeblendet',
    tags: ['Spielwelten', 'Bauen'],
    credit: '„minecraft-gta5-passthrough“ (Rehan Remade) · Bild via Reddit',
  },
  {
    file: 'fusion-03.jpg',
    title: 'Skate 3 × Modern Warfare 2',
    sub: 'Neuimplementierung: MW2 in Rust nachgebaut, mit Skate-3-Modus',
    tags: ['Bewegen'],
    credit: 'Thumbnail: ZexyZek (YouTube) · Projekt: chasmlol u. a.',
  },
  {
    file: 'fusion-04.webp',
    title: 'Skyrim × Minecraft',
    sub: 'Game Bridge „SkyCraft“: Minecraft-Steuerung und Minecraft-HUD in Skyrims Welt',
    tags: ['Bauen', 'Spielwelten'],
    credit: 'SkyCraft (chasmlol) · Bild: Caffs (YouTube) via Reddit',
  },
]

// Die sieben Adobe-inspirierten Nachbauten der ArtCraft „Craft Apps“ (Stand 14.10.2026)
export const ARTCRAFT_APPS = [
  { name: 'PhotoCraft', like: 'Photoshop', icon: 'artcraft-icon-photocraft.png', color: '#2f6fdb' },
  { name: 'VectorCraft', like: 'Illustrator', icon: 'artcraft-icon-vectorcraft.png', color: '#d4492f' },
  { name: 'FilmCraft', like: 'Premiere Pro', icon: 'artcraft-icon-filmcraft.png', color: '#7b4be0' },
  { name: 'LightCraft', like: 'Lightroom', icon: 'artcraft-icon-lightcraft.png', color: '#d99a17' },
  { name: 'PdfCraft', like: 'Acrobat', icon: 'artcraft-icon-pdfcraft.png', color: '#1f8f72' },
  { name: 'EffectCraft', like: 'After Effects', icon: 'artcraft-icon-effectcraft.png', color: '#c42a74' },
  { name: 'DesignCraft', like: 'InDesign', icon: 'artcraft-icon-designcraft.png', color: '#5d8c1e' },
]

export const ARTCRAFT = {
  overview: 'artcraft-apps.png',
  overviewCredit: 'Screenshot: ArtCraft Launcher, github.com/storytold/craft-launcher',
  photocraft: 'photocraft-demo.jpg',
  photocraftCredit: 'PhotoCraft-Screenshot: github.com/storytold · Motiv: Hokusai (gemeinfrei)',
}

// Video-Tipp im Abspann (Link und QR-Code)
export const VIDEO = {
  url: 'https://www.youtube.com/watch?v=LPEqG_K5lv0',
  title: 'Es ist vorbei',
  author: 'Niklas Steenfatt',
}

export const SOURCES = [
  ['Super Mario 64 × Elden Ring', 'Mod „ER Mario“ von Deltaroo (github.com/deltarooo/er-mario); Bild: esport1.hu, 03.10.2026'],
  ['Minecraft × GTA V', 'Beispielprojekt „minecraft-gta5-passthrough“ aus universal-modder (github.com/rehan-remade/universal-modder); Bild via Reddit'],
  ['Skate 3 × Modern Warfare 2', 'Thumbnail: ZexyZek, YouTube „The Skate 3 in MW2 Mod is Unbelievable…“; Projekt „2010 Rust Rewrite Mashup“ (chasmlol), IW4L, skate-3-rust-engine'],
  ['Skyrim × Minecraft', 'SkyCraft von chasmlol (github.com/chasmlol/SkyCraft); Bild: Caffs, YouTube, via Reddit'],
  ['ArtCraft / PhotoCraft', 'getartcraft.com · github.com/storytold (README, AGENTS.md, Parity-Doku), abgerufen 14.10.2026'],
  ['Einordnung', 'HotHardware, 08.10.2026: „Dev Uses AI To Build Clones Of Photoshop And Entire Adobe Suite For Free“'],
  ['Sounds & Musik', 'Kenney.nl (CC0) · „Bossa Nova“ von Joth und „Air Woosh“ von Almitory, OpenGameArt (CC0)'],
]
