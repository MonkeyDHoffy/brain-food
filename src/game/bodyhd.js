// Detaillierte Körper im "64-Bit-Stil": doppelte Pixeldichte (48×56 statt 24×28), 4–5 Töne pro Material,
// Schattierung, Glanzlichter und Stoffstrukturen. Gleiche Posen und Proportionen wie der klassische Körper,
// gezeichnet wird mit Blick nach rechts (Licht von vorn-oben).
const K = 2
export const HD_W = 48
export const HD_H = 56

const SKIN = { base: '#e8b996', shade: '#d09a78', deep: '#b57d5d', light: '#f4cfb0' }

export const STYLES = {
  strick: {
    label: 'Strick',
    top: { base: '#ece2cd', shade: '#d8c9ab', deep: '#bca88a', light: '#f8f2e4', rib: '#c9b796' },
    pants: { base: '#4a5f76', shade: '#384a5e', deep: '#283646', light: '#6580a0', seam: '#3a4c62' },
    shoe: { base: '#2f2f2c', light: '#55554f', sole: '#f1efe7', soleShade: '#cfccc0', lace: '#e4e1d6', accent: '#55554f', back: '#232321' },
  },
  hoodie: {
    label: 'Hoodie',
    top: { base: '#2f7a5c', shade: '#23634a', deep: '#174937', light: '#4c9a77', rib: '#1f5844' },
    pants: { base: '#353d48', shade: '#282f38', deep: '#1c2229', light: '#4b5664', seam: '#4b5664' },
    shoe: { base: '#f3f1ea', light: '#ffffff', sole: '#d4cfc4', soleShade: '#b9b3a6', lace: '#c8c4b8', accent: '#2f7a5c', back: '#c9c4b8' },
    logo: '#dcea9e',
    string: '#eef5c9',
  },
}

const R = (g, x, y, w, h, c) => {
  g.fillStyle = c
  g.fillRect(Math.round(x), Math.round(y), w, h)
}

function stamp(g, x, y, w, c) {
  g.fillStyle = c
  const o = Math.floor(w / 2)
  g.fillRect(Math.round(x) - o, Math.round(y) - o, w, w)
}

function limb(g, x0, y0, x1, y1, w, c) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= steps; i++) stamp(g, x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, w, c)
}

// Punkt auf einer Strecke (t = 0..1)
const lerp = (x0, y0, x1, y1, t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]

function arm(g, sx, sy, hx, hy, back, S) {
  const T = S.top
  // Ärmel: dunkler Rand, Grundton, Lichtkante auf der Oberseite
  limb(g, sx, sy, hx, hy, 7, back ? T.deep : T.shade)
  limb(g, sx, sy, hx, hy, 5, back ? T.shade : T.base)
  if (!back) limb(g, sx - 1, sy - 1, hx - 1, hy - 2, 1, T.light)
  // Bündchen kurz vor der Hand
  const [cx, cy] = lerp(sx, sy, hx, hy, 0.86)
  stamp(g, cx, cy, 7, back ? T.deep : T.rib)
  stamp(g, cx, cy, 3, back ? T.shade : T.shade)
  // Hand mit Schatten und Daumen
  const x = Math.round(hx)
  const y = Math.round(hy) + 2
  R(g, x - 2, y, 5, 5, back ? SKIN.shade : SKIN.base)
  R(g, x - 2, y + 4, 5, 1, back ? SKIN.deep : SKIN.shade)
  R(g, x + 2, y + 1, 1, 3, back ? SKIN.deep : SKIN.shade)
  if (!back) R(g, x - 1, y, 2, 1, SKIN.light)
}

function leg(g, hx, hy, ax, ay, back, S) {
  const Pn = S.pants
  limb(g, hx, hy, ax, ay, 7, back ? Pn.deep : Pn.shade)
  limb(g, hx, hy, ax, ay, 5, back ? Pn.shade : Pn.base)
  if (!back) {
    // Lichtkante vorn, Naht, Knie-Glanz
    limb(g, hx + 2, hy + 1, ax + 2, ay - 2, 1, Pn.light)
    limb(g, hx - 1, hy + 2, ax - 1, ay - 1, 1, Pn.seam)
    const [kx, ky] = lerp(hx, hy, ax, ay, 0.45)
    R(g, kx + 1, ky, 2, 2, Pn.light)
  }
  // Saum
  R(g, ax - 3, ay - 1, 7, 2, back ? Pn.deep : Pn.shade)
  // Sneaker zeigt nach vorn (rechts)
  const Sh = S.shoe
  const x = Math.round(ax) - 3
  const y = Math.round(ay) + 1
  R(g, x, y + 1, 10, 4, back ? Sh.back : Sh.base)
  R(g, x + 1, y, 6, 1, back ? Sh.back : Sh.base)
  g.clearRect(x + 9, y + 1, 1, 1)
  if (!back) {
    R(g, x + 1, y + 1, 5, 1, Sh.light)
    R(g, x + 3, y + 2, 1, 1, Sh.lace)
    R(g, x + 5, y + 2, 1, 1, Sh.lace)
    R(g, x + 7, y + 3, 2, 1, Sh.accent)
  }
  R(g, x - 1, y + 5, 12, 2, Sh.sole)
  R(g, x - 1, y + 6, 12, 1, Sh.soleShade)
}

function torso(g, lift, S, style) {
  const T = S.top
  const y0 = 12 - lift
  const y1 = 35
  const x0 = 14
  const x1 = 33
  const h = y1 - y0 + 1
  // Grundkörper mit Seitenschatten (hinten) und Licht (vorn)
  R(g, x0, y0, x1 - x0 + 1, h, T.base)
  R(g, x0, y0, 4, h, T.shade)
  R(g, x0, y0, 2, h, T.deep)
  R(g, x1 - 2, y0 + 2, 1, h - 6, T.light)
  R(g, x1, y0 + 1, 1, h - 1, T.shade)
  // Schultern runden
  for (const [x, y] of [[x0, y0], [x0 + 1, y0], [x0, y0 + 1], [x1, y0], [x1 - 1, y0], [x1, y0 + 1]]) g.clearRect(x, y, 1, 1)
  // Schatten unter dem Kopf
  R(g, 19, y0 + 2, 10, 1, T.shade)

  if (style === 'strick') {
    // Rippstrick: senkrechte Maschenreihen, leicht versetzt
    for (let x = x0 + 5; x < x1 - 1; x += 3)
      for (let y = y0 + 4; y < y1 - 3; y += 2) R(g, x, y + ((x / 3) % 2), 1, 1, T.shade)
    // Zopfmuster in der Mitte
    for (let y = y0 + 5; y < y1 - 4; y += 4) {
      R(g, 23, y, 2, 1, T.light)
      R(g, 22, y + 1, 1, 1, T.shade)
      R(g, 25, y + 1, 1, 1, T.shade)
      R(g, 23, y + 2, 2, 1, T.deep)
    }
    // Rundkragen
    R(g, 18, y0, 12, 2, T.rib)
    R(g, 19, y0 + 1, 10, 1, T.shade)
  } else {
    // Kapuze hinter dem Hals
    R(g, 16, y0 - 2, 16, 4, T.deep)
    R(g, 17, y0 - 3, 14, 2, T.shade)
    R(g, 19, y0 - 1, 10, 2, T.rib)
    // Kordeln mit Enden
    R(g, 21, y0 + 2, 1, 8, S.string)
    R(g, 25, y0 + 2, 1, 7, S.string)
    R(g, 20, y0 + 10, 3, 2, S.string)
    R(g, 24, y0 + 9, 3, 2, S.string)
    // Kängurutasche
    R(g, 17, y1 - 11, 15, 7, T.shade)
    R(g, 18, y1 - 11, 13, 1, T.light)
    R(g, 17, y1 - 10, 1, 6, T.deep)
    R(g, 31, y1 - 10, 1, 6, T.deep)
    // Pixel-Gehirn-Logo auf der Brust
    const lx = 28
    const ly = y0 + 5
    R(g, lx, ly, 4, 1, S.logo)
    R(g, lx - 1, ly + 1, 6, 2, S.logo)
    R(g, lx, ly + 3, 4, 1, S.logo)
    R(g, lx + 1, ly + 1, 1, 2, T.shade)
    R(g, lx + 3, ly + 2, 1, 1, T.shade)
  }
  // Bündchen unten
  R(g, x0, y1 - 2, x1 - x0 + 1, 3, T.rib)
  for (let x = x0 + 1; x < x1; x += 2) R(g, x, y1 - 2, 1, 3, T.deep)

  // Hals
  const ny = 6 - lift
  R(g, 20, ny, 8, y0 - ny + 1, SKIN.base)
  R(g, 20, ny, 2, y0 - ny + 1, SKIN.shade)
  R(g, 20, y0 - 1, 8, 1, SKIN.deep)
}

/** Zeichnet eine Pose (Parameter in 1×-Koordinaten des klassischen Körpers) in doppelter Auflösung. */
export function paintHD(g, p, style) {
  const S = STYLES[style]
  const s = (a) => a.map((v) => v * K)
  arm(g, ...s(p.arms.back), true, S)
  leg(g, ...s(p.legs.back), true, S)
  leg(g, ...s(p.legs.front), false, S)
  torso(g, p.lift * K, S, style)
  arm(g, ...s(p.arms.front), false, S)
}
