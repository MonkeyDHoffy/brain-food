// Winzige 3×5-Pixelschrift für Schilder in der Spielwelt (ON AIR, Nummern, Pfeile).
const F = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '1000111011101011000110001', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '1000110001101011010101010', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010',
  8: '010101010101010', 9: '010101011001110',
  '>': '100010001010100', '<': '100010001010100', '-': '000000111000000', '.': '000000000000010',
  '!': '010010010000010', '?': '110001010000010', ':': '000010000010000', '/': '001001010100100',
  ' ': '000000000000000',
}

// Breite eines Zeichens: 3 Spalten, breite Zeichen (W, M) haben 5 Spalten (25 statt 15 Bits)
const cols = (ch) => ((F[ch] ?? F[' ']).length === 25 ? 5 : 3)

export function textWidth(s) {
  return [...s.toUpperCase()].reduce((w, ch) => w + cols(ch) + 1, 0) - 1
}

/** Zeichnet Text in Pixeln. x, y = linke obere Ecke. */
export function pixelText(g, s, x, y, color) {
  g.fillStyle = color
  let cx = Math.round(x)
  for (const ch of s.toUpperCase()) {
    const m = F[ch] ?? F[' ']
    const w = cols(ch)
    for (let i = 0; i < m.length; i++) {
      if (m[i] === '1') {
        const px = i % w
        // '<' ist ein gespiegeltes '>'
        g.fillRect(cx + (ch === '<' ? w - 1 - px : px), Math.round(y) + Math.floor(i / w), 1, 1)
      }
    }
    cx += w + 1
  }
}

/** Pixeltext als SVG (für große Titel im HTML, z. B. LEVEL COMPLETE). px = Größe eines Pixels. */
export function pixelSvg(text, { px = 12, color = '#dcea9e', shadow = '#174937', label = text } = {}) {
  let rects = ''
  let cx = 0
  for (const ch of text.toUpperCase()) {
    const m = F[ch] ?? F[' ']
    const w = cols(ch)
    for (let i = 0; i < m.length; i++) if (m[i] === '1') rects += `<rect x="${cx + (ch === '<' ? w - 1 - (i % w) : i % w)}" y="${Math.floor(i / w)}" width="1" height="1"/>`
    cx += w + 1
  }
  const W = cx - 1 + 0.5
  const H = 5.5
  return `<svg role="img" aria-label="${label}" width="${W * px}" height="${H * px}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges"><g fill="${shadow}" transform="translate(.5 .5)">${rects}</g><g fill="${color}">${rects}</g></svg>`
}
