// Effekte: Staub beim Landen, Funken (KI-Momente), "Figur wird kompiliert" (zerfällt in 0/1 und läuft
// durchs Rohr) und der Glitch-Übergang beim Raumwechsel.
import { P } from './palette.js'
import { FLOOR, LH } from './rooms.js'
import { HEAD_H } from './player.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

function hash(i, j, s = 0) {
  let h = (i * 374761393 + j * 668265263 + s * 2147483647) >>> 0
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0
  return (h ^ (h >>> 16)) / 4294967296
}

export class FX {
  constructor() {
    this.dust = []
    this.sparks = []
    this.morph = null
    this.glitch = 0
    this.dissolve = 0
    this.tmp = document.createElement('canvas')
  }

  /** Beim Raumwechsel: laufende Effekte beenden (offene Versprechen auflösen). */
  reset() {
    if (this.morph) {
      this.morph.player.hidden = false
      this.morph.resolve()
      this.morph = null
    }
    this.dust = []
    this.sparks = []
  }

  dustAt(x, y, n = 6) {
    if (reduced) n = Math.min(n, 3)
    for (let i = 0; i < n; i++)
      this.dust.push({ x, y: y - 1, vx: (Math.random() * 2 - 1) * 30, vy: -Math.random() * 18, life: 0.35 + Math.random() * 0.25, c: P.wallDD })
  }

  sparkle(x, y, n = 10, colors = [P.lime, P.paper2, P.limeD]) {
    if (reduced) n = Math.min(n, 4)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 20 + Math.random() * 40
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 15, life: 0.5 + Math.random() * 0.5, c: colors[i % colors.length] })
    }
  }

  /**
   * Figur zerfällt in Nullen und Einsen, die ins Rohr des Knopfs laufen, und setzt sich wieder zusammen.
   * Liefert ein Promise, das nach dem Effekt erfüllt wird.
   */
  compileFigure(player, pipeX, color) {
    if (this.morph) this.morph.resolve()
    return new Promise((resolve) => {
      const pts = []
      const n = reduced ? 30 : 90
      for (let i = 0; i < n; i++) {
        const onHead = i % 3 !== 0
        const px = player.x + (Math.random() * 2 - 1) * (onHead ? 11 : 6)
        const py = onHead ? player.y - 22 - Math.random() * HEAD_H : player.y - Math.random() * 22
        pts.push({ hx: px, hy: py, ch: Math.random() < 0.5 ? '0' : '1', d: Math.random() * 0.25, wob: Math.random() * 6 })
      }
      this.morph = { player, pts, t: 0, pipeX, color, resolve, swapped: false }
      player.hidden = true
    })
  }

  update(dt) {
    for (const arr of [this.dust, this.sparks]) {
      for (const p of arr) {
        p.life -= dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += (arr === this.dust ? 60 : 40) * dt
      }
    }
    this.dust = this.dust.filter((p) => p.life > 0)
    this.sparks = this.sparks.filter((p) => p.life > 0)
    const m = this.morph
    if (m) {
      m.t += dt
      if (m.t >= 1.75) {
        m.player.hidden = false
        this.sparkle(m.player.x, m.player.y - 30, 12, [m.color, P.paper2])
        this.morph = null
        m.resolve()
      }
    }
  }

  drawLow(g) {
    for (const p of this.dust) {
      g.globalAlpha = Math.min(1, p.life * 3)
      g.fillStyle = p.c
      g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
    }
    for (const p of this.sparks) {
      g.globalAlpha = Math.min(1, p.life * 2)
      g.fillStyle = p.c
      g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)
      if (p.life > 0.6) g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1)
    }
    g.globalAlpha = 1
  }

  drawHi(g, S) {
    const m = this.morph
    if (!m) return
    g.save()
    g.font = `700 ${Math.round(4.2 * S)}px "JetBrains Mono", monospace`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const entryY = FLOOR + 1
    for (const p of m.pts) {
      // 0–0.35 s: aufbrechen, 0.35–0.85 s: ins Rohr, 0.85–1.1 s: weg, 1.1–1.75 s: zurück
      let x
      let y
      let a = 1
      const t = m.t - p.d * 0.5
      if (t < 0.35) {
        const k = Math.max(0, t) / 0.35
        x = p.hx + Math.sin(k * 6 + p.wob) * 1.5
        y = p.hy - k * 3
      } else if (t < 0.85) {
        const k = (t - 0.35) / 0.5
        const e = k * k
        x = p.hx + (m.pipeX - p.hx) * e
        y = p.hy - 3 + (entryY + 10 - p.hy) * e
        a = y > entryY ? Math.max(0, 1 - (y - entryY) / 10) : 1
      } else if (t < 1.1) {
        a = 0
        x = m.pipeX
        y = LH
      } else {
        const k = Math.min(1, (t - 1.1) / 0.6)
        const e = 1 - Math.pow(1 - k, 3)
        x = m.pipeX + (p.hx - m.pipeX) * e
        y = entryY + 6 + (p.hy - entryY - 6) * e
        a = Math.min(1, k * 3)
      }
      g.globalAlpha = a
      g.fillStyle = (p.wob | 0) % 3 === 0 ? P.paper2 : m.color
      g.fillText(p.ch, x * S, y * S)
    }
    g.restore()
  }

  /** Glitch und Pixel-Zerfall auf dem fertigen Bild (Übergang zwischen Räumen). */
  post(g, canvas, t) {
    const amt = this.glitch
    const dis = this.dissolve
    if (amt <= 0.001 && dis <= 0.001) return
    const W = canvas.width
    const H = canvas.height
    if (!reduced && amt > 0.001) {
      if (this.tmp.width !== W || this.tmp.height !== H) {
        this.tmp.width = W
        this.tmp.height = H
      }
      const tg = this.tmp.getContext('2d')
      tg.clearRect(0, 0, W, H)
      tg.drawImage(canvas, 0, 0)
      const seed = Math.floor(t / 55)
      const slices = 6 + Math.floor(amt * 10)
      for (let i = 0; i < slices; i++) {
        const y = Math.floor(hash(i, seed) * H)
        const h = Math.floor((0.02 + hash(i, seed, 1) * 0.08) * H)
        const dx = (hash(i, seed, 2) * 2 - 1) * amt * W * 0.06
        g.drawImage(this.tmp, 0, y, W, h, dx, y, W, h)
      }
      const blocks = Math.floor(amt * 26)
      const cols = [P.lime, P.rust, P.ink, P.green]
      for (let i = 0; i < blocks; i++) {
        g.fillStyle = cols[i % cols.length]
        g.globalAlpha = 0.55
        g.fillRect(hash(i, seed, 3) * W, hash(i, seed, 4) * H, (0.01 + hash(i, seed, 5) * 0.06) * W, 0.012 * H + hash(i, seed, 6) * 0.03 * H)
      }
      g.globalAlpha = 1
    }
    if (dis > 0.001) {
      // Raster aus Zellen, die nacheinander "zu Bits werden"
      const cell = Math.max(8, Math.round(H / 19))
      g.font = `700 ${Math.round(cell * 0.72)}px "JetBrains Mono", monospace`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      for (let cy = 0; cy * cell < H; cy++) {
        for (let cx = 0; cx * cell < W; cx++) {
          const r = hash(cx, cy, 9)
          // Welle von links nach rechts plus Zufall
          const threshold = (cx * cell) / W * 0.45 + r * 0.55
          if (threshold > dis) continue
          g.fillStyle = '#1b2d28'
          g.fillRect(cx * cell, cy * cell, cell, cell)
          if (r > 0.35) {
            g.fillStyle = r > 0.8 ? P.lime : '#3f8a6c'
            g.fillText(hash(cx, cy, Math.floor(t / 120)) > 0.5 ? '1' : '0', cx * cell + cell / 2, cy * cell + cell / 2 + 1)
          }
        }
      }
    }
  }
}
