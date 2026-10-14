// Spielzeit. Sie läuft nur, wenn nicht pausiert ist. Alle Wartezeiten und Animationen des Ablaufs
// hängen an dieser Uhr, damit Pause wirklich alles anhält. ?speed=4 beschleunigt (nur für Tests).
const timers = new Set()
const anims = new Set()

export const clock = {
  t: 0, // ms Spielzeit
  paused: false,
  speed: 1,
  tick(dtReal) {
    if (this.paused) return 0
    const dt = dtReal * this.speed
    this.t += dt
    for (const a of [...anims]) {
      const p = Math.min(1, (this.t - a.start) / a.ms)
      try {
        a.fn(p)
      } catch (e) {
        console.error(e)
      }
      if (p >= 1) {
        anims.delete(a)
        a.resolve()
      }
    }
    for (const tm of [...timers]) {
      if (this.t >= tm.at) {
        timers.delete(tm)
        tm.resolve()
      }
    }
    return dt
  },
}

export class Aborted extends Error {
  constructor() {
    super('abgebrochen')
    this.name = 'AbortError'
  }
}

export const isAbort = (e) => e && e.name === 'AbortError'

function onAbort(signal, cleanup, reject) {
  if (!signal) return
  if (signal.aborted) {
    cleanup()
    reject(new Aborted())
    return
  }
  signal.addEventListener('abort', () => { cleanup(); reject(new Aborted()) }, { once: true })
}

/** Wartet ms Spielzeit (pausierbar, abbrechbar). */
export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const tm = { at: clock.t + ms, resolve }
    timers.add(tm)
    onAbort(signal, () => timers.delete(tm), reject)
  })
}

/** Ruft fn(p) mit p = 0..1 über ms Spielzeit auf. */
export function animate(ms, fn, signal) {
  return new Promise((resolve, reject) => {
    const a = { start: clock.t, ms: Math.max(1, ms), fn, resolve }
    anims.add(a)
    fn(0)
    onAbort(signal, () => anims.delete(a), reject)
  })
}

/** Wartet, bis check() wahr ist (geprüft jeden Frame, auch während Pause nicht weiter). */
export function until(check, signal) {
  return new Promise((resolve, reject) => {
    const a = { start: clock.t, ms: 1e12, fn: () => { if (check()) { anims.delete(a); resolve() } }, resolve }
    anims.add(a)
    onAbort(signal, () => anims.delete(a), reject)
  })
}

export const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: (p) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2) },
}
