// Autopilot: steuert die Figur über dieselben virtuellen Tasten wie ein Mensch – läuft zum Ziel,
// springt auf Knöpfe, drückt E am Mikrofon und geht durch Türen.
import { input } from '../engine/input.js'
import { until, sleep, isAbort, clock } from '../engine/clock.js'
import { FRICTION, AIR_FRICTION } from '../game/player.js'
import { BUTTON } from '../game/rooms.js'

const frame = (signal) => until(() => true, signal)

function linked(...signals) {
  const ctrl = new AbortController()
  for (const s of signals) {
    if (!s) continue
    if (s.aborted) ctrl.abort()
    else s.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  return ctrl.signal
}

export class Autopilot {
  constructor(world) {
    this.world = world
    this.job = null
  }

  get busy() {
    return !!this.job
  }

  cancel() {
    this.job?.abort()
    this.job = null
    input.releaseVirtual()
  }

  /** Führt die Aktion für ein Ziel aus (Mikrofon, Knopf, Tür). */
  async perform(id, signal) {
    this.cancel()
    const ctrl = new AbortController()
    this.job = ctrl
    const sig = linked(signal, ctrl.signal)
    const o = this.world.obj(id)
    try {
      if (!o) return
      await sleep(250, sig)
      if (o.kind === 'mic') {
        await this.walkTo(o.x - 18, sig)
        await this.face(1, sig)
        await sleep(250, sig)
        input.tap('interact')
      } else if (o.kind === 'button') {
        await this.jumpOnto(o, sig)
      } else if (o.kind === 'door') {
        await this.walkTo(o.x + 2, sig, 2)
      }
    } catch (e) {
      if (!isAbort(e)) console.error(e)
    } finally {
      input.releaseVirtual()
      if (this.job === ctrl) this.job = null
    }
  }

  async face(dir, sig) {
    const p = this.world.player
    if (p.facing === dir) return
    input.hold(dir > 0 ? 'right' : 'left', true)
    await frame(sig)
    input.hold(dir > 0 ? 'right' : 'left', false)
  }

  /** Läuft zur Position x und bremst rechtzeitig. */
  async walkTo(x, sig, tol = 1.5) {
    const p = this.world.player
    for (let guard = 0; guard < 2000; guard++) {
      const d = x - p.x
      const brake = (p.vx * p.vx) / (2 * FRICTION)
      if (Math.abs(d) <= tol || (Math.abs(d) <= brake + 0.8 && Math.sign(p.vx) === Math.sign(d))) break
      input.hold('right', d > 0)
      input.hold('left', d < 0)
      await frame(sig)
    }
    input.hold('right', false)
    input.hold('left', false)
    await until(() => Math.abs(p.vx) < 1 && p.ground, sig)
  }

  /** Springt von der Seite auf einen Knopf und bremst in der Luft über der Mitte. */
  async jumpOnto(o, sig) {
    const p = this.world.player
    for (let attempt = 0; attempt < 3; attempt++) {
      const side = p.x < o.x ? -1 : 1
      // Steht die Figur schon auf diesem Knopf? Dann erst heruntergehen.
      if (p.platform?.obj === o) await this.walkTo(o.x + side * (BUTTON.w / 2 + 10), sig)
      await this.walkTo(o.x + side * 24, sig)
      const dir = -side
      await this.face(dir, sig)
      await sleep(120, sig)
      input.tap('jump')
      const key = dir > 0 ? 'right' : 'left'
      input.hold(key, true)
      // erst abheben lassen – der Sprung wird im nächsten Frame verarbeitet
      const t0 = clock.t
      await until(() => !p.ground || clock.t - t0 > 400, sig)
      await until(() => {
        const d = (o.x - p.x) * dir
        const brake = (p.vx * p.vx) / (2 * AIR_FRICTION)
        return d <= brake + 0.5 || p.ground
      }, sig)
      input.hold(key, false)
      await until(() => p.ground, sig)
      if (p.platform?.obj === o) return
      await sleep(200, sig)
    }
  }
}
