// Fotokopf der Spielfigur im South-Park-Stil: Der Kiefer sitzt fest auf dem Hals, der Oberkopf klappt
// beim Reden um einen Drehpunkt am Hinterkopf auf. Dazu kommen Kulleraugen mit etwas Trägheit, die
// wackeln, blinzeln und dorthin schauen, wo gerade etwas passiert.
// Koordinaten in diesem Modul: Pixel des Kopfbilds (siehe tools/align_head.py und src/data/head.json).
import meta from '../data/head.json'

const W = meta.width
const H = meta.height
const CHIN = { x: (meta.jawTopSpan[0] + meta.jawTopSpan[1]) / 2, y: meta.jawBottomY }
const CUT = meta.upperCutY
const MOUTH_L = meta.jawTopSpan[0] + 4
const MOUTH_R = meta.jawTopSpan[1] - 4
const PIVOT = { x: meta.upperCutSpan[0] + 18, y: CUT } // Hinterkopf (Blick nach rechts)
const EYES = [{ x: 136, y: 248 }, { x: 263, y: 254 }]
const EYE_R = 33
const PUPIL_R = 14
const MAX_ANGLE = 0.34 // rad, etwa 19°
const MAX_LIFT = 10

function loadImage(src) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  return img
}

export class Head {
  constructor(base = '') {
    this.upper = loadImage(base + 'char/head_upper.png')
    this.jaw = loadImage(base + 'char/head_jaw.png')
    this.open = 0 // 0 = geschlossen, 1 = weit offen
    this.target = 0
    this.googly = true
    this.look = { x: 0.15, y: 0.05 } // Blickrichtung im Kopfraum (+x = nach vorn)
    this.eyes = EYES.map(() => ({ x: 0, y: 4, vx: 0, vy: 0 }))
    this.blink = 0
    this.nextBlink = 2.5
    this.prevOpen = 0
    this.lastV = { x: 0, y: 0 }
  }

  get ready() {
    return this.upper.complete && this.jaw.complete && this.upper.naturalWidth > 0
  }

  /** Mundöffnung als Ziel (0..1), wird weich angenähert. */
  setTalk(level) {
    this.target = Math.max(0, Math.min(1, level))
  }

  setLook(x, y) {
    const len = Math.hypot(x, y)
    const k = len > 1 ? 1 / len : 1
    this.look.x = x * k
    this.look.y = y * k
  }

  /** Stoß für die Kulleraugen, z. B. beim Landen oder bei einem Sprung (in Kopfpixeln/s). */
  kick(vx, vy) {
    for (const e of this.eyes) {
      e.vx += vx * (0.8 + Math.random() * 0.4)
      e.vy += vy * (0.8 + Math.random() * 0.4)
    }
  }

  /** dt in Sekunden; vel = Bewegung der Figur in Weltpixeln/s (für die Trägheit der Pupillen). */
  update(dt, vel = { x: 0, y: 0 }, facing = 1) {
    // Mund: schnell auf, etwas langsamer zu
    const rate = this.target > this.open ? 30 : 18
    this.open += (this.target - this.open) * (1 - Math.exp(-dt * rate))
    const flap = (this.open - this.prevOpen) / Math.max(dt, 1e-3)
    this.prevOpen = this.open

    // Beschleunigung der Figur → Pupillen schwingen entgegen
    const ax = (vel.x - this.lastV.x) / Math.max(dt, 1e-3)
    const ay = (vel.y - this.lastV.y) / Math.max(dt, 1e-3)
    this.lastV = { x: vel.x, y: vel.y }

    const maxOff = EYE_R - PUPIL_R - 4
    this.eyes.forEach((e, i) => {
      const tx = this.look.x * maxOff * (i ? 1.05 : 0.95)
      const ty = this.look.y * maxOff
      let fx = (tx - e.x) * 70 - e.vx * 7 - ax * facing * 0.35
      let fy = (ty - e.y) * 70 - e.vy * 7 + 220 - ay * 0.35 + flap * 18 * (i ? 1.1 : 0.9)
      e.vx += fx * dt
      e.vy += fy * dt
      e.x += e.vx * dt
      e.y += e.vy * dt
      const d = Math.hypot(e.x, e.y)
      if (d > maxOff) {
        const nx = e.x / d
        const ny = e.y / d
        e.x = nx * maxOff
        e.y = ny * maxOff
        const vn = e.vx * nx + e.vy * ny
        if (vn > 0) {
          e.vx -= 1.6 * vn * nx
          e.vy -= 1.6 * vn * ny
        }
      }
    })

    // Blinzeln
    this.nextBlink -= dt
    if (this.nextBlink <= 0) {
      this.blink = 0.0001
      this.nextBlink = 2.2 + Math.random() * 4
      if (Math.random() < 0.18) this.nextBlink = 0.35 // manchmal doppelt
    }
    if (this.blink > 0) {
      this.blink += dt / 0.16
      if (this.blink >= 1) this.blink = 0
    }
  }

  lid() {
    const a = this.open * MAX_ANGLE
    return { a, lift: this.open * MAX_LIFT }
  }

  // Punkt aus dem Oberkopf-Raum in Kopfbild-Koordinaten (nach Aufklappen)
  lidPoint(x, y, { a, lift }) {
    const dx = x - PIVOT.x
    const dy = y - PIVOT.y
    const c = Math.cos(-a)
    const s = Math.sin(-a)
    return { x: PIVOT.x + dx * c - dy * s, y: PIVOT.y + dx * s + dy * c - lift }
  }

  /**
   * Zeichnet den Kopf. (cx, chinY) = Ansatzpunkt am Hals in Bildschirmpixeln, height = Kopfhöhe in
   * Bildschirmpixeln, facing = 1 (rechts) oder -1 (links).
   */
  draw(g, cx, chinY, height, facing = 1, alpha = 1) {
    if (!this.ready) return
    const k = height / H
    const lid = this.lid()
    g.save()
    g.globalAlpha = alpha
    g.translate(cx, chinY)
    g.scale(facing * k, k)
    g.translate(-CHIN.x, -CHIN.y)
    g.imageSmoothingEnabled = true
    g.imageSmoothingQuality = 'high'

    this.drawMouth(g, lid)
    g.drawImage(this.jaw, 0, 0)

    g.save()
    g.translate(PIVOT.x, PIVOT.y - lid.lift)
    g.rotate(-lid.a)
    g.translate(-PIVOT.x, -PIVOT.y)
    g.drawImage(this.upper, 0, 0)
    if (this.googly) this.drawEyes(g)
    g.restore()

    g.restore()
  }

  drawMouth(g, lid) {
    const tl = this.lidPoint(MOUTH_L, CUT - 1, lid)
    const tr = this.lidPoint(MOUTH_R, CUT - 1, lid)
    g.fillStyle = '#3a1416'
    g.beginPath()
    g.moveTo(MOUTH_L, CUT + 8)
    g.lineTo(MOUTH_R, CUT + 8)
    g.lineTo(tr.x, tr.y)
    g.lineTo(tl.x, tl.y)
    g.closePath()
    g.fill()
    // Geschlossen bleibt nur der dunkle Spalt als Lippenlinie sichtbar
    if (this.open < 0.06) return
    // Zunge
    g.fillStyle = '#a5464c'
    g.beginPath()
    g.ellipse(CHIN.x + 10, CUT + 4, 70, 10 + this.open * 8, 0, Math.PI, 0)
    g.fill()
    // obere Zahnreihe hängt am Oberkopf
    const a = this.lidPoint(MOUTH_L + 34, CUT, lid)
    const b = this.lidPoint(MOUTH_R - 34, CUT, lid)
    const c = this.lidPoint(MOUTH_R - 34, CUT + 13, lid)
    const d = this.lidPoint(MOUTH_L + 34, CUT + 13, lid)
    g.fillStyle = '#f3eee4'
    g.beginPath()
    g.moveTo(a.x, a.y)
    g.lineTo(b.x, b.y)
    g.lineTo(c.x, c.y)
    g.lineTo(d.x, d.y)
    g.closePath()
    g.fill()
    g.strokeStyle = 'rgba(120,100,90,0.35)'
    g.lineWidth = 1.5
    for (let i = 1; i < 6; i++) {
      const t = i / 6
      g.beginPath()
      g.moveTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
      g.lineTo(d.x + (c.x - d.x) * t, d.y + (c.y - d.y) * t)
      g.stroke()
    }
  }

  drawEyes(g) {
    const blinkCover = this.blink > 0 ? Math.sin(this.blink * Math.PI) : 0
    this.eyes.forEach((e, i) => {
      const { x, y } = EYES[i]
      // Schatten
      g.fillStyle = 'rgba(40,25,15,0.25)'
      g.beginPath()
      g.arc(x + 2, y + 4, EYE_R + 2, 0, Math.PI * 2)
      g.fill()
      // Augapfel
      const grad = g.createRadialGradient(x - 8, y - 10, 4, x, y, EYE_R)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.75, '#f4f2ec')
      grad.addColorStop(1, '#d9d5cb')
      g.fillStyle = grad
      g.beginPath()
      g.arc(x, y, EYE_R, 0, Math.PI * 2)
      g.fill()
      // Pupille
      g.fillStyle = '#141414'
      g.beginPath()
      g.arc(x + e.x, y + e.y, PUPIL_R, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.9)'
      g.beginPath()
      g.arc(x + e.x - 5, y + e.y - 5, 4, 0, Math.PI * 2)
      g.fill()
      // Lid beim Blinzeln
      if (blinkCover > 0) {
        g.save()
        g.beginPath()
        g.arc(x, y, EYE_R, 0, Math.PI * 2)
        g.clip()
        g.fillStyle = '#dcae8b'
        g.fillRect(x - EYE_R, y - EYE_R, EYE_R * 2, EYE_R * 2 * blinkCover)
        g.fillStyle = '#b98666'
        g.fillRect(x - EYE_R, y - EYE_R + EYE_R * 2 * blinkCover - 3, EYE_R * 2, 3)
        g.restore()
      }
      // Glanz und Rand
      g.strokeStyle = '#1d1d1b'
      g.lineWidth = 4
      g.beginPath()
      g.arc(x, y, EYE_R, 0, Math.PI * 2)
      g.stroke()
      g.fillStyle = 'rgba(255,255,255,0.55)'
      g.beginPath()
      g.ellipse(x - 12, y - 16, 9, 5, -0.6, 0, Math.PI * 2)
      g.fill()
    })
  }
}

export const HEAD_META = { W, H }
