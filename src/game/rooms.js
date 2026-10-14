// Die drei Räume: Aufbau (Objekte) und Pixel-Grafik. Statische Teile werden einmal pro Raum in eine
// Leinwand gemalt, bewegliche Teile (Wolken, Bildschirme, Tür, Knöpfe, Licht) jeden Frame.
// Spielfeld: 480×114 Pixel, Boden bei y = 100.
import { P } from './palette.js'
import { pixelText, textWidth } from './pixelfont.js'

export const LW = 480
export const LH = 114
export const FLOOR = 100

export const ROOMS = {
  r1: {
    id: 'r1', index: 1, name: 'Spielefusionen', spawn: 64, entry: false,
    objects: [
      { id: 'mic', kind: 'mic', x: 252 },
      { id: 'door', kind: 'door', x: 452 },
    ],
  },
  r2: {
    id: 'r2', index: 2, name: 'Compiler-Labor', spawn: 52, entry: true,
    objects: [
      { id: 'btn-compile', kind: 'button', x: 170, color: 'green', num: '1', label: 'Kompilieren' },
      { id: 'btn-decompile', kind: 'button', x: 320, color: 'rust', num: '2', label: 'Dekompilieren' },
      { id: 'door', kind: 'door', x: 452 },
    ],
  },
  r3: {
    id: 'r3', index: 3, name: 'Software-Atelier', spawn: 52, entry: true,
    objects: [
      { id: 'btn-artcraft', kind: 'button', x: 246, color: 'lime', num: 'A', label: 'ArtCraft' },
      { id: 'door', kind: 'door', x: 452 },
    ],
  },
}

export const BUTTON = { w: 26, top: 86, dome: 4 }
export const DOOR = { w: 24, h: 50 }

// ------------------------------------------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

const R = (g, x, y, w, h, c) => {
  g.fillStyle = c
  g.fillRect(x, y, w, h)
}

function ceiling(g, color) {
  R(g, 0, 0, LW, 4, color)
  R(g, 0, 4, LW, 1, P.wallDD)
}

function floor(g, plank = P.wood, plank2 = P.wood2) {
  R(g, 0, FLOOR, LW, 2, P.ink)
  const rand = rng(7)
  for (let y = FLOOR + 2, row = 0; y < LH; y += 3, row++) {
    R(g, 0, y, LW, 3, row % 2 ? plank : plank2)
    R(g, 0, y + 2, LW, 1, P.woodD)
    let x = Math.floor(rand() * 30)
    while (x < LW) {
      R(g, x, y, 1, 2, P.woodDD)
      x += 26 + Math.floor(rand() * 22)
    }
  }
}

function wainscot(g, y0, base, trim) {
  R(g, 0, y0, LW, FLOOR - y0, base)
  R(g, 0, y0, LW, 2, trim)
  R(g, 0, y0 + 2, LW, 1, P.wallDD)
  for (let x = 12; x < LW; x += 32) {
    R(g, x, y0 + 7, 24, 1, P.wallDD)
    R(g, x, y0 + 7, 1, FLOOR - y0 - 12, P.wallDD)
    R(g, x + 1, y0 + 8, 23, 1, P.paper2 + '55')
  }
  R(g, 0, FLOOR - 3, LW, 3, P.ink2)
}

function frame(g, x, y, w, h, inner) {
  R(g, x - 1, y - 1, w + 2, h + 2, P.ink)
  R(g, x, y, w, h, P.paper2)
  R(g, x + 2, y + 2, w - 4, h - 4, inner)
}

function plant(g, x, y = FLOOR) {
  R(g, x - 5, y - 9, 10, 9, P.pot)
  R(g, x - 6, y - 10, 12, 2, P.potD)
  R(g, x - 4, y - 8, 2, 7, '#cf7a52')
  const leaves = [[-1, -22, 3, 13], [-7, -19, 4, 9], [4, -20, 4, 10], [-5, -27, 3, 8], [2, -28, 3, 9], [-10, -15, 4, 5], [7, -15, 4, 5]]
  for (const [dx, dy, w, h] of leaves) {
    R(g, x + dx, y + dy, w, h, P.leafD)
    R(g, x + dx, y + dy, w - 1, h - 2, P.leaf)
    R(g, x + dx, y + dy, 1, Math.max(1, h - 4), P.leafL)
  }
}

function lamp(g, x) {
  R(g, x, 5, 1, 6, P.ink)
  R(g, x - 5, 11, 11, 3, P.ink)
  R(g, x - 4, 11, 9, 1, P.green)
  R(g, x - 2, 14, 5, 1, P.lime)
}

function entryDoor(g, x) {
  const top = FLOOR - DOOR.h
  R(g, x - 13, top - 2, 26, DOOR.h + 2, P.ink)
  R(g, x - 11, top, 22, DOOR.h, P.wallDD)
  R(g, x - 9, top + 3, 18, DOOR.h - 3, P.greenD)
  R(g, x - 7, top + 6, 14, 16, P.green)
  R(g, x - 7, top + 26, 14, 18, P.green)
  R(g, x + 5, top + 26, 2, 2, P.lime)
}

// --- Raum 1: Studio mit Mikrofon -------------------------------------------------------------------
function paintR1(g) {
  R(g, 0, 0, LW, FLOOR, P.wall)
  for (let x = 4; x < LW; x += 10) R(g, x, 5, 2, 70, P.wall2)
  ceiling(g, P.cream)
  wainscot(g, 74, P.wallD, P.cream)
  // Poster: Spiele-Mix (abstrakt, keine echten Logos)
  frame(g, 128, 20, 30, 38, P.green)
  R(g, 134, 28, 8, 8, P.lime)
  R(g, 134, 36, 8, 2, P.limeD)
  R(g, 142, 34, 10, 10, P.rustL)
  R(g, 144, 36, 6, 6, P.rust)
  pixelText(g, 'MIX', 137, 50, P.lime)
  frame(g, 336, 22, 34, 30, P.limeL)
  R(g, 342, 28, 9, 9, P.green)
  R(g, 355, 28, 9, 9, P.rust)
  R(g, 350, 31, 6, 3, P.ink)
  pixelText(g, 'GAME', 346, 42, P.muted)
  // Regal mit Spielmodulen
  R(g, 172, 44, 40, 2, P.woodD)
  R(g, 172, 46, 40, 1, P.woodDD)
  const carts = [[176, P.green], [183, P.rust], [190, P.limeD], [197, P.ink2], [204, P.greenL]]
  for (const [cx, col] of carts) {
    R(g, cx, 34, 6, 10, col)
    R(g, cx + 1, 36, 4, 3, P.paper2)
  }
  lamp(g, 252)
  plant(g, 418)
  plant(g, 108)
  floor(g)
  // Teppich liegt auf dem Boden
  R(g, 212, FLOOR + 2, 80, 4, P.rust)
  R(g, 216, FLOOR + 3, 72, 1, P.rustL)
  for (let x = 216; x < 288; x += 6) R(g, x, FLOOR + 4, 3, 1, P.lime)
}

// --- Raum 2: Compiler-Labor ------------------------------------------------------------------------
function paintR2(g) {
  R(g, 0, 0, LW, FLOOR, '#e3e9dc')
  // Leiterbahnen an der Wand
  const rand = rng(42)
  for (let i = 0; i < 26; i++) {
    let x = Math.floor(rand() * LW)
    let y = 8 + Math.floor(rand() * 60)
    const len = 10 + Math.floor(rand() * 40)
    const horiz = rand() > 0.4
    R(g, x, y, horiz ? len : 1, horiz ? 1 : Math.min(len, 70 - y), '#d3dccb')
    R(g, x - 1, y - 1, 3, 3, '#cbd5c0')
    R(g, x, y, 1, 1, P.limeD)
  }
  ceiling(g, '#d7dfcf')
  wainscot(g, 76, '#cad5c2', '#dfe6d6')
  entryDoor(g, 26)
  // Großer Monitor (Inhalt dynamisch)
  R(g, 62, 18, 62, 44, P.ink)
  R(g, 64, 20, 58, 36, P.screen)
  R(g, 88, 62, 10, 6, P.ink2)
  R(g, 80, 68, 26, 2, P.ink)
  // Serverschrank (LEDs dynamisch)
  R(g, 236, 36, 30, 64, P.ink)
  R(g, 238, 38, 26, 60, P.ink2)
  for (let y = 42; y < 96; y += 8) R(g, 240, y, 22, 5, '#38544b')
  lamp(g, 170)
  lamp(g, 320)
  plant(g, 404)
  floor(g, '#bfa27c', '#b29470')
}

// --- Raum 3: Software-Atelier ----------------------------------------------------------------------
function paintR3(g) {
  R(g, 0, 0, LW, FLOOR, '#efe9da')
  for (let y = 8; y < 74; y += 8) for (let x = (y / 8) % 2 ? 0 : 6; x < LW; x += 12) R(g, x, y, 2, 2, '#e6dfcd')
  ceiling(g, P.cream)
  wainscot(g, 76, '#ddd3bd', '#f2ecdd')
  entryDoor(g, 26)
  // Galerie: 7 Rahmen (Inhalt dynamisch)
  for (let i = 0; i < 7; i++) frame(g, 98 + i * 30, 18, 22, 18, '#e8e1cf')
  // Staffelei mit Leinwand
  R(g, 352, 50, 2, 50, P.woodDD)
  R(g, 372, 50, 2, 50, P.woodDD)
  R(g, 362, 44, 2, 56, P.woodD)
  R(g, 346, 48, 34, 26, P.ink)
  R(g, 348, 50, 30, 22, P.paper2)
  R(g, 351, 60, 10, 8, P.greenXL)
  R(g, 357, 54, 8, 8, P.lime)
  R(g, 364, 62, 10, 7, P.rustL)
  R(g, 344, 74, 38, 2, P.woodD)
  // Farbpalette und Kleckse
  R(g, 392, FLOOR + 3, 3, 1, P.rustL)
  R(g, 120, FLOOR + 6, 4, 1, P.greenL)
  R(g, 300, FLOOR + 4, 3, 1, P.limeD)
  lamp(g, 246)
  lamp(g, 362)
  plant(g, 416)
  floor(g)
  R(g, 386, FLOOR + 3, 3, 1, P.rustL)
  R(g, 124, FLOOR + 6, 3, 1, P.greenL)
  R(g, 296, FLOOR + 5, 4, 1, P.limeD)
}

const PAINTERS = { r1: paintR1, r2: paintR2, r3: paintR3 }
const cache = new Map()

export function roomBackground(id) {
  if (cache.has(id)) return cache.get(id)
  const c = document.createElement('canvas')
  c.width = LW
  c.height = LH
  PAINTERS[id](c.getContext('2d'))
  cache.set(id, c)
  return c
}

// --- Bewegliche Teile ------------------------------------------------------------------------------
const BITS = '0110100111001011010011101001'

export function drawRoomDynamic(g, room, st, t) {
  if (room.id === 'r1') {
    // Fenster mit ziehenden Wolken
    const wx = 24
    const wy = 16
    R(g, wx - 2, wy - 2, 68, 50, P.ink)
    R(g, wx, wy, 64, 46, P.sky)
    R(g, wx, wy + 30, 64, 16, P.skyD)
    for (let i = 0; i < 3; i++) {
      const cx = wx + ((((t / 1000) * (3 + i) + i * 31) % 90) - 18)
      const cy = wy + 6 + i * 9
      g.save()
      g.beginPath()
      g.rect(wx, wy, 64, 46)
      g.clip()
      R(g, Math.round(cx), cy, 14, 4, P.cloud)
      R(g, Math.round(cx) + 3, cy - 2, 7, 2, P.cloud)
      g.restore()
    }
    R(g, wx + 31, wy, 2, 46, P.paper2)
    R(g, wx, wy + 22, 64, 2, P.paper2)
    R(g, wx - 4, wy + 46, 72, 3, P.paper2)
    R(g, wx - 4, wy + 49, 72, 1, P.wallDD)
    // ON-AIR-Schild über dem Mikrofon
    const on = st.onAir
    const sx = 186 - 15
    R(g, sx - 1, 17, 32, 11, P.ink)
    R(g, sx, 18, 30, 9, on ? P.rust : P.ink2)
    pixelText(g, 'ON AIR', sx + 3, 20, on ? P.lime : P.muted)
    // Spot-Licht
    if (st.spot > 0) {
      g.globalAlpha = 0.16 * st.spot
      for (let y = 14; y < FLOOR; y += 2) {
        const w = 6 + (y - 14) * 0.62
        R(g, Math.round(252 - w / 2), y, Math.round(w), 2, P.lime)
      }
      g.globalAlpha = 1
    }
  }
  if (room.id === 'r2') {
    // Monitor: laufende Bitspalten
    g.save()
    g.beginPath()
    g.rect(64, 20, 58, 36)
    g.clip()
    const speed = st.screenBoost ? 40 : 12
    for (let col = 0; col < 9; col++) {
      for (let row = 0; row < 8; row++) {
        const n = BITS[(col * 5 + row + Math.floor((t / 1000) * speed * (1 + (col % 3) * 0.3))) % BITS.length]
        const x = 66 + col * 6
        const y = 22 + row * 5
        g.fillStyle = n === '1' ? P.screenL : '#4c7d64'
        if (n === '1') g.fillRect(x + 1, y, 1, 4)
        else {
          g.fillRect(x, y, 3, 1)
          g.fillRect(x, y + 3, 3, 1)
          g.fillRect(x, y, 1, 4)
          g.fillRect(x + 2, y, 1, 4)
        }
      }
    }
    g.restore()
    // LEDs im Serverschrank
    for (let i = 0; i < 7; i++) {
      const on = Math.sin(t / (180 + i * 37) + i) > 0.2
      R(g, 242 + (i % 3) * 7, 43 + Math.floor(i / 1) * 8, 2, 1, on ? (i % 2 ? P.lime : P.rustL) : '#2c443c')
    }
  }
  if (room.id === 'r3') {
    // Galerie: Rahmen füllen sich mit Werkzeug-Kacheln, wenn ArtCraft gezeigt wird
    const ICONS = [
      [P.green, 'img'], [P.rust, 'pen'], [P.ink2, 'film'], [P.limeD, 'type'], [P.greenL, 'shape'], [P.rustD, 'layers'], [P.ink, 'wave'],
    ]
    for (let i = 0; i < 7; i++) {
      const lit = st.gallery > i
      const x = 98 + i * 30
      const y = 18
      if (!lit) continue
      R(g, x + 2, y + 2, 18, 14, ICONS[i][0])
      drawTinyIcon(g, ICONS[i][1], x + 6, y + 4)
    }
  }
}

function drawTinyIcon(g, kind, x, y) {
  const c = P.paper2
  switch (kind) {
    case 'img':
      R(g, x, y + 7, 10, 2, c); R(g, x + 2, y + 4, 3, 3, c); R(g, x + 6, y + 2, 3, 5, c); R(g, x + 7, y, 2, 2, P.lime)
      break
    case 'pen':
      R(g, x + 4, y, 2, 6, c); R(g, x + 3, y + 6, 4, 2, c); R(g, x + 4, y + 8, 2, 1, c); R(g, x, y + 3, 10, 1, P.lime)
      break
    case 'film':
      R(g, x, y + 1, 10, 7, c); R(g, x + 1, y + 2, 8, 5, P.ink2); for (let i = 0; i < 5; i++) R(g, x + i * 2, y + 1, 1, 1, P.ink2)
      break
    case 'type':
      R(g, x + 1, y, 8, 2, c); R(g, x + 4, y + 2, 2, 7, c)
      break
    case 'shape':
      R(g, x, y + 3, 5, 5, c); R(g, x + 5, y, 4, 4, P.lime)
      break
    case 'layers':
      R(g, x + 1, y + 1, 7, 2, c); R(g, x, y + 4, 9, 2, P.lime); R(g, x + 1, y + 7, 7, 2, c)
      break
    default:
      for (let i = 0; i < 5; i++) R(g, x + i * 2, y + 4 - (i % 2 ? 3 : 0), 1, i % 2 ? 7 : 2, c)
  }
}

// --- Objekte ----------------------------------------------------------------------------------------
export function drawMic(g, o, st, t) {
  const x = o.x
  // Kabel
  R(g, x + 3, FLOOR - 1, 14, 1, P.ink)
  R(g, x + 16, FLOOR - 1, 1, 1, P.ink2)
  // Fuß
  R(g, x - 6, FLOOR - 2, 13, 2, P.ink)
  R(g, x - 4, FLOOR - 3, 9, 1, P.metalD)
  // Stange
  R(g, x, 70, 1, FLOOR - 72, P.metalD)
  R(g, x + 1, 70, 1, FLOOR - 72, P.ink)
  R(g, x - 1, 80, 3, 2, P.ink)
  // Kopf (leicht zur Figur geneigt)
  R(g, x - 3, 60, 6, 10, P.ink)
  R(g, x - 2, 61, 4, 8, P.metal)
  R(g, x - 2, 61, 1, 7, P.metalL)
  for (let yy = 62; yy < 68; yy += 2) R(g, x - 1, yy, 3, 1, P.metalD)
  R(g, x - 2, 70, 4, 2, P.ink2)
  // Kontrolllampe
  const on = st.onAir
  R(g, x + 3, 74, 2, 2, on ? (Math.sin(t / 220) > 0 ? P.rustL : P.rust) : P.ink2)
}

export function drawButton(g, o, t) {
  const x = o.x
  const w = BUTTON.w
  const base = { green: [P.green, P.greenD, P.lime], rust: [P.rust, P.rustD, P.rustXL], lime: [P.limeD, '#7f9748', P.limeL] }[o.color]
  // Rohr nach unten in den Boden (Verbindung zur Präsentationsfläche)
  R(g, x - 3, BUTTON.top + 14, 6, LH - BUTTON.top - 14, P.metalD)
  R(g, x - 2, BUTTON.top + 14, 1, LH - BUTTON.top - 14, P.metalL)
  R(g, x + 2, BUTTON.top + 14, 1, LH - BUTTON.top - 14, P.ink2)
  if (o.flow > 0) {
    // Lichtpakete im Rohr
    for (let i = 0; i < 4; i++) {
      const yy = BUTTON.top + 14 + (((t / 6 + i * 7) % 28) | 0)
      if (yy < LH) R(g, x - 1, yy, 2, 2, base[2])
    }
  }
  // Sockel
  R(g, x - w / 2, BUTTON.top + 2, w, FLOOR - BUTTON.top - 2, P.ink)
  R(g, x - w / 2 + 1, BUTTON.top + 3, w - 2, FLOOR - BUTTON.top - 4, P.ink2)
  R(g, x - w / 2 + 1, BUTTON.top + 3, w - 2, 1, '#4a6a60')
  // Schild mit Nummer
  R(g, x - 4, BUTTON.top + 5, 9, 7, base[1])
  pixelText(g, o.num, x - 1, BUTTON.top + 6, base[2])
  // Kuppel (gedrückt = flacher)
  const pressed = o.press > 0
  const h = pressed ? 2 : BUTTON.dome
  const dy = BUTTON.top + 2 - h
  R(g, x - 9, dy, 18, h, P.ink)
  R(g, x - 8, dy - 1, 16, 1, P.ink)
  R(g, x - 8, dy, 16, h, pressed ? base[1] : base[0])
  if (!pressed) {
    R(g, x - 6, dy, 5, 1, base[2])
    R(g, x - 8, dy + h - 1, 16, 1, base[1])
  }
  // Leuchtring, wenn aktiviert
  if (o.lit > 0) {
    g.globalAlpha = 0.35 + 0.25 * Math.sin(t / 160)
    R(g, x - 11, dy - 3, 22, 1, base[2])
    R(g, x - 12, dy - 2, 1, h + 3, base[2])
    R(g, x + 11, dy - 2, 1, h + 3, base[2])
    g.globalAlpha = 1
  }
}

export function drawDoor(g, o, t) {
  const x = o.x
  const top = FLOOR - DOOR.h
  // Schild
  const label = 'WEITER >'
  const lw = textWidth(label) + 6
  R(g, x - lw / 2 - 1, top - 12, lw + 2, 9, P.ink)
  R(g, x - lw / 2, top - 11, lw, 7, o.open > 0 ? P.green : P.ink2)
  pixelText(g, label, x - lw / 2 + 3, top - 10, o.open > 0 ? P.lime : P.wallD)
  // Rahmen
  R(g, x - 14, top - 2, 28, DOOR.h + 2, P.ink)
  R(g, x - 12, top, 24, DOOR.h, P.wallDD)
  // Öffnung: dunkel mit Lichtstreifen
  const ox = x - 10
  const ow = 20
  R(g, ox, top + 2, ow, DOOR.h - 2, '#1a2b26')
  if (o.open > 0) {
    g.globalAlpha = Math.min(1, o.open)
    for (let i = 0; i < 5; i++) {
      const yy = top + 6 + i * 9 + (((t / 90) | 0) % 9)
      if (yy < FLOOR - 2) R(g, ox + 2, yy, ow - 4, 1, P.lime)
    }
    R(g, ox + 3, top + 4, ow - 6, DOOR.h - 8, '#2b4a3f')
    R(g, ox + 6, top + 8, ow - 12, DOOR.h - 14, '#3d6b58')
    R(g, ox + 8, top + 12, ow - 16, DOOR.h - 20, P.lime)
    g.globalAlpha = 1
  }
  // Türblatt schwenkt nach innen auf (wird schmaler)
  const pw = Math.max(3, Math.round(ow * (1 - Math.min(1, o.open))))
  R(g, ox, top + 2, pw, DOOR.h - 2, P.green)
  if (pw > 8) {
    R(g, ox + 2, top + 5, pw - 4, 16, P.greenL)
    R(g, ox + 3, top + 6, pw - 6, 14, P.green)
    R(g, ox + 2, top + 25, pw - 4, 19, P.greenL)
    R(g, ox + 3, top + 26, pw - 6, 17, P.green)
    R(g, ox + pw - 4, top + 24, 2, 2, P.lime)
  } else {
    R(g, ox + pw - 1, top + 2, 1, DOOR.h - 2, P.greenD)
  }
  R(g, x - 14, FLOOR - 1, 28, 1, P.ink)
}

/** Pfeil, der über dem nächsten Ziel hüpft. */
export function drawArrow(g, x, y, t, color = P.lime) {
  const by = Math.round(y + Math.sin(t / 170) * 2.5)
  const rows = [[-1, 3], [-1, 3], [-1, 3], [-4, 9], [-3, 7], [-2, 5], [-1, 3], [0, 1]]
  rows.forEach(([dx, w], i) => {
    R(g, x + dx - 1, by + i - 1, w + 2, 3, P.ink)
  })
  rows.forEach(([dx, w], i) => R(g, x + dx, by + i, w, 1, color))
  R(g, x - 1, by, 1, 3, P.paper2)
}
