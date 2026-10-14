// Verwaltung der Präsentationsfläche: baut pro Raum die passende Fläche auf und reicht Frames weiter.
import { mountR1 } from './r1.js'
import { mountR2 } from './r2.js'
import { mountR3 } from './r3.js'

const MOUNT = { r1: mountR1, r2: mountR2, r3: mountR3 }

export class Pres {
  constructor(root) {
    this.root = root
    this.frames = new Set()
    this.ctrl = null
  }

  mount(roomId, signal) {
    this.frames.clear()
    this.root.innerHTML = ''
    this.ctrl = MOUNT[roomId](this.root, { signal, onFrame: (fn) => this.frames.add(fn) })
    return this.ctrl
  }

  clear() {
    this.frames.clear()
    this.root.innerHTML = ''
    this.ctrl = null
  }

  glitchOut() {
    const s = this.root.querySelector('.scene:last-child')
    if (s) {
      s.classList.remove('in')
      s.classList.add('out')
    }
  }

  update(dt) {
    for (const fn of this.frames) fn(dt)
  }
}
