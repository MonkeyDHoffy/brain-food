// Spielfigur: einfache Plattform-Physik (Laufen, Springen, Landen auf Knöpfen) und Darstellung.
// Der Körper wird in die Pixelwelt gezeichnet, der Fotokopf danach in voller Auflösung.
import { bodySprite, CX, FEET, BODY_STYLES } from './body.js'

export const DEFAULT_BODY = 'strick'
import { Head } from './head.js'
import { FLOOR, LW, BUTTON } from './rooms.js'
import { input } from '../engine/input.js'

const RUN = 82
const ACC = 760
const AIR_ACC = 620
export const FRICTION = 980
export const AIR_FRICTION = 700
const GRAVITY = 780
const JUMP_V = 240
export const HEAD_H = 34
const HALF_W = 5

export class Player {
  constructor(base) {
    this.head = new Head(base)
    // Körperstil: 'classic' | 'strick' | 'hoodie' (Taste K), gemerkt im Browser
    let saved = null
    try {
      saved = localStorage.getItem('bf-body')
    } catch {}
    this.style = BODY_STYLES.includes(saved) ? saved : DEFAULT_BODY
    this.reset(60)
  }

  reset(x) {
    this.x = x
    this.y = FLOOR
    this.vx = 0
    this.vy = 0
    this.ground = true
    this.platform = null
    this.facing = 1
    this.walk = 0
    this.stepDist = 0
    this.alpha = 1
    this.hidden = false
    this.talking = false
    this.gesture = null // 'point' | 'wave' | 'press'
    this.gestureUntil = 0
    this.t = 0
  }

  /** solids: Kollisionsboxen {x0,x1,top,obj} der Knöpfe. events: {land(obj), step(), jump()} */
  update(dt, solids, events, locked = false) {
    this.t += dt
    const left = input.isDown('left', locked)
    const right = input.isDown('right', locked)
    const dir = (right ? 1 : 0) - (left ? 1 : 0)
    const acc = this.ground ? ACC : AIR_ACC
    if (dir) {
      this.vx += dir * acc * dt
      this.vx = Math.max(-RUN, Math.min(RUN, this.vx))
      this.facing = dir
    } else {
      // Ohne Eingabe bremsen, in der Luft etwas weicher (präzise Landungen auf den Knöpfen)
      const f = (this.ground ? FRICTION : AIR_FRICTION) * dt
      this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - Math.sign(this.vx) * f
    }

    if (input.take('jump', locked) && this.ground) {
      this.vy = -JUMP_V
      this.ground = false
      this.platform = null
      events.jump?.()
      this.head.kick(0, -160)
    }

    // Horizontal bewegen, seitlich an Sockeln anstoßen
    const prevX = this.x
    let nx = this.x + this.vx * dt
    nx = Math.max(10, Math.min(LW - 10, nx))
    for (const s of solids) {
      const feetBelowTop = this.y > s.top + 1
      if (!feetBelowTop) continue
      if (prevX + HALF_W <= s.x0 && nx + HALF_W > s.x0) { nx = s.x0 - HALF_W; this.vx = 0 }
      if (prevX - HALF_W >= s.x1 && nx - HALF_W < s.x1) { nx = s.x1 + HALF_W; this.vx = 0 }
    }
    this.x = nx

    // Vertikal: Schwerkraft, Boden und Knopf-Oberseiten
    const prevY = this.y
    this.vy += GRAVITY * dt
    let ny = this.y + this.vy * dt
    let landed = null
    if (this.vy >= 0) {
      for (const s of solids) {
        if (this.x + HALF_W > s.x0 && this.x - HALF_W < s.x1 && prevY <= s.top + 0.5 && ny >= s.top) {
          ny = s.top
          landed = s
        }
      }
      if (!landed && ny >= FLOOR) {
        ny = FLOOR
        landed = { floor: true }
      }
    }
    const wasGround = this.ground
    if (landed) {
      const impact = this.vy
      this.vy = 0
      this.ground = true
      this.platform = landed.floor ? null : landed
      if (!wasGround) {
        events.land?.(landed.obj || null, impact)
        this.head.kick(0, Math.min(320, impact * 1.2))
      }
    } else {
      this.ground = false
    }
    // Von der Kante gelaufen?
    if (this.ground && this.platform && (this.x + HALF_W <= this.platform.x0 || this.x - HALF_W >= this.platform.x1)) {
      this.ground = false
      this.platform = null
    }
    this.y = ny

    // Schritte
    if (this.ground && Math.abs(this.vx) > 4) {
      this.walk += dt * (Math.abs(this.vx) / RUN) * 9
      this.stepDist += Math.abs(this.x - prevX)
      if (this.stepDist > 12) {
        this.stepDist = 0
        events.step?.()
      }
    } else this.walk = 0

    if (this.gesture && this.t > this.gestureUntil) this.gesture = null
  }

  gest(name, seconds = 1.2) {
    this.gesture = name
    this.gestureUntil = this.t + seconds
  }

  pose() {
    if (!this.ground) return [this.vy < 0 ? 'jump' : 'fall', 0]
    if (Math.abs(this.vx) > 4) return ['walk', Math.floor(this.walk) % 4]
    if (this.gesture) return [this.gesture, Math.floor(this.t * 3) % 2]
    if (this.talking) return ['talk', Math.floor(this.t * 1.25) % 2]
    return ['idle', Math.floor(this.t * 1.4) % 2]
  }

  /** Körper in die Pixelwelt zeichnen; liefert den Halsansatz (Weltkoordinaten) für den Kopf. */
  drawBody(g) {
    const [name, f] = this.pose()
    const spr = bodySprite(name, f, this.style)
    if (spr.scale === 2) {
      // 64-Bit-Körper: halbe Spielfeld-Pixel als Raster, gezeichnet später in voller Auflösung
      const hx = Math.round(this.x * 2) / 2 - CX
      const hy = Math.round(this.y * 2) / 2 - FEET
      this.hd = { spr, x: hx, y: hy }
      return { x: hx + spr.neckX, y: hy + spr.neckY + 1.5 }
    }
    this.hd = null
    const bx = Math.round(this.x) - CX
    const by = Math.round(this.y) - FEET
    if (!this.hidden && this.alpha > 0) {
      g.save()
      g.globalAlpha = this.alpha
      if (this.facing < 0) {
        g.translate(bx * 2 + spr.canvas.width, 0)
        g.scale(-1, 1)
      }
      g.drawImage(spr.canvas, bx, by)
      g.restore()
    }
    const neckX = this.facing > 0 ? bx + spr.neckX : bx + spr.canvas.width - spr.neckX
    return { x: neckX, y: by + spr.neckY + 1.5 }
  }

  drawHead(g, neck, S) {
    if (this.hidden || this.alpha <= 0) return
    if (this.hd) {
      const { spr, x, y } = this.hd
      g.save()
      g.globalAlpha = this.alpha
      g.imageSmoothingEnabled = false
      const w = (spr.canvas.width / 2) * S
      const h = (spr.canvas.height / 2) * S
      if (this.facing < 0) {
        g.translate(x * S * 2 + w, 0)
        g.scale(-1, 1)
      }
      g.drawImage(spr.canvas, x * S, y * S, w, h)
      g.restore()
    }
    this.head.draw(g, neck.x * S, neck.y * S, HEAD_H * S, this.facing, this.alpha)
  }

  /** Position des Mundes in Weltkoordinaten (für Sprechblase). */
  mouth(neck) {
    return { x: neck.x, y: neck.y - HEAD_H * 0.24, top: neck.y - HEAD_H }
  }
}

export { BUTTON }
