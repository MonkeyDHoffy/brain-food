// Pixel-Körper der Spielfigur (Pullover, Jeans, Sneaker), prozedural gezeichnet.
// Jede Pose wird einmal in eine kleine Leinwand (24×28 px) gemalt, automatisch umrandet und zwischengespeichert.
// Ursprung: Füße bei y = FEET, Körpermitte bei x = CX. Gezeichnet wird mit Blick nach rechts.
import { P } from './palette.js'
import { paintHD, STYLES, HD_W, HD_H } from './bodyhd.js'

export const BODY_W = 24
export const BODY_H = 28
export const FEET = 26
export const CX = 12
const NECK_TOP = 3 // Zeile, an der der Kiefer ansetzt

const cache = new Map()

function stamp(g, x, y, w, color) {
  g.fillStyle = color
  const o = Math.floor(w / 2)
  g.fillRect(Math.round(x) - o, Math.round(y) - o, w, w)
}

function limb(g, x0, y0, x1, y1, w, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= steps; i++) stamp(g, x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, w, color)
}

// Ein Arm: Ärmel mit dunklerem Rand, dazu eine Hand am Ende
function arm(g, sx, sy, hx, hy, back) {
  limb(g, sx, sy, hx, hy, 3, back ? P.sweaterR : P.sweaterR)
  limb(g, sx, sy, hx, hy, 1, back ? P.sweaterD : P.sweater)
  g.fillStyle = back ? P.skinD : P.skin
  g.fillRect(Math.round(hx) - 1, Math.round(hy) + 1, 3, 2)
}

function leg(g, hx, hy, ax, ay, back) {
  limb(g, hx, hy, ax, ay, 3, back ? P.jeansD : P.jeans)
  // Schuh zeigt nach vorn (rechts)
  g.fillStyle = P.shoe
  g.fillRect(Math.round(ax) - 1, Math.round(ay) + 1, 5, 2)
  g.fillStyle = P.sole
  g.fillRect(Math.round(ax) - 1, Math.round(ay) + 3, 5, 1)
}

function torso(g, lift) {
  const y0 = 6 - lift
  g.fillStyle = P.sweater
  g.fillRect(7, y0, 10, 12 + lift)
  g.fillStyle = P.sweaterD
  g.fillRect(7, y0, 2, 12 + lift)
  g.fillRect(16, y0 + 1, 1, 11 + lift)
  // Schultern abrunden
  g.clearRect(7, y0, 1, 1)
  g.clearRect(16, y0, 1, 1)
  // Bündchen und Kragen
  g.fillStyle = P.sweaterR
  g.fillRect(7, 17, 10, 1)
  g.fillRect(9, y0, 6, 1)
  // Hals
  g.fillStyle = P.skin
  g.fillRect(10, NECK_TOP - lift, 4, y0 - (NECK_TOP - lift))
  g.fillStyle = P.skinD
  g.fillRect(10, y0 - 1, 4, 1)
}

function outline(c) {
  const g = c.getContext('2d')
  const img = g.getImageData(0, 0, c.width, c.height)
  const d = img.data
  const W = c.width
  const H = c.height
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0
  const out = []
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) out.push([x, y])
  g.fillStyle = P.outline
  for (const [x, y] of out) g.fillRect(x, y, 1, 1)
}

// Posen: Parameter für Beine, Arme und Oberkörper
function poseSpec(name, f) {
  const hang = { back: [8, 8, 6, 15], front: [16, 8, 18, 15] }
  switch (name) {
    case 'walk': {
      const sw = [3, 0, -3, 0][f]
      const lift = [0, 1, 0, 1][f]
      return {
        lift,
        legs: { back: [10, 17, 10 - sw, 22 - (f === 1 ? 2 : 0)], front: [14, 17, 14 + sw, 22 - (f === 3 ? 2 : 0)] },
        arms: { back: [8, 8 - lift, 7 + sw, 15 - lift], front: [16, 8 - lift, 17 - sw, 15 - lift] },
      }
    }
    case 'jump':
      return { lift: 1, legs: { back: [10, 17, 8, 20], front: [14, 17, 16, 20] }, arms: { back: [8, 7, 5, 3], front: [16, 7, 19, 3] } }
    case 'fall':
      return { lift: 0, legs: { back: [10, 17, 9, 22], front: [14, 17, 15, 22] }, arms: { back: [8, 8, 3, 9], front: [16, 8, 21, 9] } }
    case 'talk':
      return {
        lift: 0,
        legs: { back: [10, 17, 10, 22], front: [14, 17, 14, 22] },
        arms: { back: hang.back, front: f === 0 ? [16, 8, 21, 11] : [16, 8, 20, 6] },
      }
    case 'point':
      return { lift: 0, legs: { back: [10, 17, 10, 22], front: [14, 17, 14, 22] }, arms: { back: hang.back, front: [16, 8, 22, 13] } }
    case 'wave':
      return { lift: 0, legs: { back: [10, 17, 10, 22], front: [14, 17, 14, 22] }, arms: { back: hang.back, front: f === 0 ? [16, 8, 19, 0] : [16, 8, 21, 2] } }
    case 'press':
      return { lift: 0, legs: { back: [10, 17, 9, 22], front: [14, 17, 15, 22] }, arms: { back: [8, 8, 4, 12], front: [16, 8, 20, 12] } }
    default: // idle
      return { lift: f, legs: { back: [10, 17, 10, 22], front: [14, 17, 14, 22] }, arms: { back: [8, 8 - f, 6, 15 - f], front: [16, 8 - f, 18, 15 - f] } }
  }
}

/**
 * Liefert die fertige Pose als Leinwand plus Ankerpunkt des Halses (in Spielfeld-Pixeln).
 * style: 'classic' (24×28, einfache Pixel) oder ein 64-Bit-Stil aus bodyhd.js ('strick', 'hoodie') mit
 * doppelter Pixeldichte – scale = 2 heißt: zwei Sprite-Pixel pro Spielfeld-Pixel.
 */
export function bodySprite(name = 'idle', frame = 0, style = 'classic') {
  const key = `${style}:${name}${frame}`
  let s = cache.get(key)
  if (s) return s
  const hd = style !== 'classic' && STYLES[style]
  const c = document.createElement('canvas')
  c.width = hd ? HD_W : BODY_W
  c.height = hd ? HD_H : BODY_H
  const g = c.getContext('2d')
  const p = poseSpec(name, frame)
  if (hd) paintHD(g, p, style)
  else {
    arm(g, ...p.arms.back, true)
    leg(g, ...p.legs.back, true)
    leg(g, ...p.legs.front, false)
    torso(g, p.lift)
    arm(g, ...p.arms.front, false)
  }
  outline(c)
  s = { canvas: c, neckX: 12, neckY: NECK_TOP - p.lift, scale: hd ? 2 : 1 }
  cache.set(key, s)
  return s
}

export const BODY_STYLES = ['classic', ...Object.keys(STYLES)]
export const BODY_LABELS = { classic: 'Klassik', ...Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, v.label])) }
