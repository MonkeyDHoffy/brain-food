// Spielfeld: Raum, Figur, Objekte, Effekte. Rendert die Pixelwelt in 480×114 und skaliert sie ohne
// Glättung auf die Leinwand; Kopf, Ziffern-Effekte und Glitch kommen danach in voller Auflösung.
import { ROOMS, LW, LH, FLOOR, BUTTON, DOOR, roomBackground, drawRoomDynamic, drawMic, drawButton, drawDoor, drawArrow } from './rooms.js'
import { Player, HEAD_H } from './player.js'
import { FX } from './fx.js'
import { P } from './palette.js'
import { input } from '../engine/input.js'
import { audio } from '../engine/audio.js'

export const FIELD_SCALE = 4 // Spielfeld-Pixel → Bühnen-Pixel (1920×456)

export class World {
  constructor(canvas, labelsEl) {
    this.canvas = canvas
    this.g = canvas.getContext('2d')
    this.low = document.createElement('canvas')
    this.low.width = LW
    this.low.height = LH
    this.lg = this.low.getContext('2d')
    this.labelsEl = labelsEl
    this.player = new Player(import.meta.env.BASE_URL)
    this.fx = new FX()
    this.handlers = {}
    this.room = null
    this.objects = []
    this.st = {}
    this.locked = false
    this.arrowId = null
    this.hintEl = null
    this.lookAt = null
    this.mouth = () => 0
    this.t = 0
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e))
    canvas.addEventListener('pointermove', (e) => this.onHover(e))
  }

  on(type, fn) {
    ;(this.handlers[type] ||= new Set()).add(fn)
    return () => this.handlers[type].delete(fn)
  }

  emit(type, ...args) {
    for (const fn of this.handlers[type] || []) fn(...args)
  }

  obj(id) {
    return this.objects.find((o) => o.id === id)
  }

  setRoom(id) {
    const def = ROOMS[id]
    this.room = def
    this.objects = def.objects.map((o) => ({ ...o, armed: false, open: 0, press: 0, lit: 0, flow: 0 }))
    this.st = { onAir: false, spot: 0, screenBoost: false, gallery: 0 }
    this.player.reset(def.entry ? 30 : def.spawn)
    this.player.alpha = def.entry ? 0 : 1
    this.arrowId = null
    this.lookAt = null
    this.renderLabels()
    this.setHint(null)
  }

  /** Feste Beschriftungen (Knopfschilder) als HTML über der Leinwand. */
  renderLabels() {
    this.labelsEl.innerHTML = ''
    for (const o of this.objects) {
      if (o.kind !== 'button') continue
      const el = document.createElement('div')
      el.className = `plate plate-${o.color}`
      el.style.left = `${o.x * FIELD_SCALE}px`
      el.style.top = `${(BUTTON.top - 26) * FIELD_SCALE}px`
      el.innerHTML = `<b>${o.num}</b><span>${o.label}</span>`
      el.dataset.id = o.id
      this.labelsEl.appendChild(el)
    }
    this.hintEl = document.createElement('div')
    this.hintEl.className = 'hint'
    this.hintEl.hidden = true
    this.labelsEl.appendChild(this.hintEl)
  }

  /** Pfeil + Hinweis über einem Ziel. text = null blendet aus. */
  setHint(id, text) {
    this.arrowId = id
    if (!this.hintEl) return
    if (!id || !text) {
      this.hintEl.hidden = true
      return
    }
    const o = this.obj(id)
    const top = this.objectTop(o)
    this.hintEl.innerHTML = text
    this.hintEl.style.left = `${o.x * FIELD_SCALE}px`
    this.hintEl.style.top = `${(top - 30) * FIELD_SCALE}px`
    this.hintEl.hidden = false
    this.hintEl.classList.remove('pop')
    void this.hintEl.offsetWidth
    this.hintEl.classList.add('pop')
  }

  objectTop(o) {
    if (o.kind === 'mic') return 58
    if (o.kind === 'door') return FLOOR - DOOR.h - 12
    return BUTTON.top - BUTTON.dome - 2
  }

  solids() {
    return this.objects
      .filter((o) => o.kind === 'button')
      .map((o) => ({ x0: o.x - BUTTON.w / 2, x1: o.x + BUTTON.w / 2, top: BUTTON.top - 1, obj: o }))
  }

  resize(w, h) {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
  }

  // --- Ablauf ---------------------------------------------------------------------------------------
  update(dtMs) {
    const dt = Math.min(0.05, dtMs / 1000)
    this.t += dtMs
    if (!this.room) return
    const p = this.player
    const events = {
      jump: () => audio.sfx('jump', { jitter: 0.05 }),
      step: () => audio.sfx(`step-${1 + Math.floor(Math.random() * 3)}`, { jitter: 0.08 }),
      land: (obj, impact) => {
        if (impact > 120) audio.sfx('land', { vol: Math.min(1, impact / 260) })
        this.fx.dustAt(p.x, p.y, 5)
        if (obj && obj.kind === 'button') this.pressButton(obj)
      },
    }
    p.update(dt, this.solids(), events, this.locked)

    // Interaktion (E) am Mikrofon oder an der Tür
    if (input.take('interact', this.locked)) {
      const near = this.objects.find((o) => (o.kind === 'mic' || o.kind === 'door') && Math.abs(o.x - p.x) < (o.kind === 'mic' ? 30 : 20))
      if (near) this.tryActivate(near)
    }
    // In eine offene, freigegebene Tür hineinlaufen
    const door = this.obj('door')
    if (door && door.armed && door.open > 0.9 && !this.locked && p.ground && p.x > door.x - 7) this.tryActivate(door)

    // Schilder treten zurück, wenn die Figur davor steht
    for (const el of this.labelsEl.querySelectorAll('.plate')) {
      const o = this.obj(el.dataset.id)
      el.classList.toggle('behind', !!o && Math.abs(o.x - p.x) < 24)
    }
    for (const o of this.objects) {
      if (o.press > 0) o.press = Math.max(0, o.press - dt * 1.4)
      if (o.kind === 'button' && p.platform?.obj === o) o.press = Math.max(o.press, 0.2)
      if (o.openTarget !== undefined) o.open += (o.openTarget - o.open) * Math.min(1, dt * 5)
    }

    // Kopf: Mund, Blick, Trägheit
    const level = this.mouth()
    p.talking = level >= 0
    p.head.setTalk(Math.max(0, level))
    this.updateLook()
    p.head.update(dt, { x: p.vx * 4, y: p.vy * 4 }, p.facing)
    this.fx.update(dt)
  }

  updateLook() {
    const p = this.player
    const h = p.head
    let tx
    let ty
    if (this.lookAt === 'down') {
      tx = 0.15
      ty = 0.95
    } else if (this.lookAt === 'audience' || p.talking) {
      tx = 0.05 + Math.sin(this.t / 1900) * 0.15
      ty = 0.1
    } else if (this.arrowId) {
      const o = this.obj(this.arrowId)
      const dx = (o.x - p.x) * p.facing
      tx = Math.max(-1, Math.min(1, dx / 60))
      ty = 0.15
    } else {
      tx = Math.sin(this.t / 1300) * 0.6
      ty = 0.2 + Math.sin(this.t / 2100) * 0.2
    }
    h.setLook(tx, ty)
  }

  pressButton(o) {
    o.press = 1
    audio.sfx('button')
    this.fx.dustAt(o.x - 8, BUTTON.top, 3)
    this.fx.dustAt(o.x + 8, BUTTON.top, 3)
    this.tryActivate(o)
  }

  tryActivate(o) {
    if (!o.armed) {
      this.emit('nope', o.id)
      return
    }
    o.armed = false
    this.emit('activate', o.id)
  }

  arm(id, on = true) {
    const o = this.obj(id)
    if (o) o.armed = on
  }

  openDoor(open = true) {
    const d = this.obj('door')
    if (!d) return
    d.openTarget = open ? 1 : 0
    if (open) audio.sfx('door')
  }

  // --- Maus -----------------------------------------------------------------------------------------
  toWorld(e) {
    const r = this.canvas.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * LW, y: ((e.clientY - r.top) / r.height) * LH }
  }

  hit(pt) {
    return this.objects.find((o) => {
      const top = this.objectTop(o) - 4
      const half = o.kind === 'door' ? 15 : o.kind === 'mic' ? 12 : BUTTON.w / 2 + 2
      return Math.abs(pt.x - o.x) <= half && pt.y >= top && pt.y <= FLOOR + 2
    })
  }

  onPointer(e) {
    const o = this.hit(this.toWorld(e))
    if (o) this.emit('click', o.id)
  }

  onHover(e) {
    const o = this.hit(this.toWorld(e))
    this.canvas.style.cursor = o && o.armed ? 'pointer' : 'default'
  }

  // --- Zeichnen -------------------------------------------------------------------------------------
  render() {
    const g = this.g
    const lg = this.lg
    if (!this.room) return
    const t = this.t
    lg.drawImage(roomBackground(this.room.id), 0, 0)
    drawRoomDynamic(lg, this.room, this.st, t)
    for (const o of this.objects) {
      if (o.kind === 'mic') drawMic(lg, o, this.st, t)
      if (o.kind === 'door') drawDoor(lg, o, t)
      if (o.kind === 'button') drawButton(lg, o, t)
    }
    const neck = this.player.drawBody(lg)
    this.fx.drawLow(lg)
    if (this.arrowId) {
      const o = this.obj(this.arrowId)
      if (o) drawArrow(lg, o.x, this.objectTop(o) - 12, t, o.kind === 'button' && o.color === 'rust' ? P.rustXL : P.lime)
    }

    const W = this.canvas.width
    const H = this.canvas.height
    const S = W / LW
    g.imageSmoothingEnabled = false
    g.drawImage(this.low, 0, 0, W, H)
    this.player.drawHead(g, neck, S)
    this.fx.drawHi(g, S)
    this.fx.post(g, this.canvas, t)
    this.neck = neck
  }

  /** Bühnenkoordinaten (1920×456) des Kopfes, für die Sprechblase. */
  headAnchor() {
    const n = this.neck || { x: this.player.x, y: FLOOR - 22 }
    return { x: n.x * FIELD_SCALE, top: (n.y - HEAD_H) * FIELD_SCALE, mouthY: (n.y - HEAD_H * 0.25) * FIELD_SCALE }
  }
}
