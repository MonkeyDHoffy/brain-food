// Regie: führt die Räume nacheinander aus, verbindet Sprechen, Spielwelt, Präsentationsfläche und
// Autopilot und kümmert sich um Pause, Überspringen, Raumwechsel und Moduswechsel.
import { ROOM_SCRIPTS } from './script.js'
import { Autopilot } from './autopilot.js'
import { ROOMS } from '../game/rooms.js'
import { audio } from '../engine/audio.js'
import { input } from '../engine/input.js'
import { clock, sleep, animate, ease, isAbort, Aborted } from '../engine/clock.js'
import { run } from '../pres/util.js'
import { SEQ, sentenceFile } from '../engine/speech.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const PRELOAD = { r1: ['01-intro'], r2: ['02-compile', '03-decompile-cleanroom', 'gag-jannik'], r3: ['04-artcraft-outlook', 'abschied'] }

export class Director {
  constructor({ world, speech, pres, ui }) {
    this.world = world
    this.speech = speech
    this.pres = pres
    this.ui = ui
    this.autopilot = new Autopilot(world)
    this.mode = 'manual'
    this.paused = false
    this.armed = null
    this.ctrl = null
    this.roomId = null
    this.startedAt = 0
    world.on('click', (id) => this.onClick(id))
    input.onManual(() => {
      if (this.mode === 'auto' && !this.paused) this.setMode('manual', true)
    })
  }

  get signal() {
    return this.ctrl?.signal
  }

  setMode(mode, takeover = false) {
    this.mode = mode
    this.ui.mode(mode)
    if (mode === 'auto') {
      if (this.armed) {
        this.world.setHint(this.armed.id, null)
        this.autopilot.perform(this.armed.id, this.signal)
      }
    } else {
      this.autopilot.cancel()
      if (this.armed) this.world.setHint(this.armed.id, this.armed.hint)
      if (takeover) this.ui.toast('Manuelle Steuerung')
    }
  }

  /** Startet den Ablauf ab einem Raum (bricht einen laufenden Ablauf sauber ab). */
  async play(roomId = 'r1') {
    this.stop()
    // Alter Text und Abspann dürfen beim Sprung/Neustart nicht stehen bleiben
    this.ui.hideEnding()
    this.ui.clearSubtitle(roomId)
    const ctrl = new AbortController()
    this.ctrl = ctrl
    const signal = ctrl.signal
    if (roomId === 'r1') this.startedAt = clock.t
    let id = roomId
    try {
      while (id && id !== 'end') {
        await this.enterRoom(id, signal)
        const next = await ROOM_SCRIPTS[id](this.ctx(signal))
        await this.leaveRoom(signal)
        id = next
      }
      if (id === 'end') {
        this.world.locked = true
        this.ui.ending({ seconds: (clock.t - this.startedAt) / 1000 })
      }
    } catch (e) {
      if (!isAbort(e)) console.error(e)
    }
  }

  stop() {
    this.ctrl?.abort()
    this.ctrl = null
    this.autopilot.cancel()
    this.speech.skipAll()
    audio.stopVoice()
    this.armed = null
    this.world.setHint(null)
  }

  async enterRoom(id, signal) {
    const w = this.world
    this.roomId = id
    w.setRoom(id)
    w.locked = true
    this.presCtrl = this.pres.mount(id, signal)
    this.ui.room(ROOMS[id])
    // Aufnahmen des Raums schon vorladen (falls vorhanden), damit beim Auslösen nichts hakt
    for (const seq of PRELOAD[id] || []) {
      if (audio.hasAudio(SEQ[seq].audio)) audio.voice(seq, SEQ[seq].audio)
      SEQ[seq].sentences.forEach((_, i) => {
        const f = sentenceFile(seq, i)
        if (audio.hasAudio(f)) audio.voice(f, f)
      })
    }
    // Glitch-Einblendung: Bits lösen sich auf
    w.fx.dissolve = 1
    w.fx.glitch = reduced ? 0 : 0.8
    await animate(reduced ? 300 : 650, (p) => {
      w.fx.dissolve = 1 - ease.inOut(p)
      w.fx.glitch = reduced ? 0 : 0.8 * (1 - p)
    }, signal)
    w.fx.dissolve = 0
    w.fx.glitch = 0
    const room = ROOMS[id]
    if (room.entry) {
      // Figur kommt durch die Eingangstür und geht ein paar Schritte in den Raum
      await animate(260, (p) => (w.player.alpha = p), signal)
      await this.autopilot.walkTo(room.spawn, signal)
    }
    w.player.alpha = 1
    w.player.head.brow('flash')
    w.locked = false
  }

  async leaveRoom(signal) {
    const w = this.world
    w.locked = true
    this.autopilot.cancel()
    await animate(320, (p) => (w.player.alpha = 1 - p), signal)
    audio.sfx('glitch')
    this.pres.glitchOut()
    await animate(reduced ? 300 : 700, (p) => {
      w.fx.glitch = reduced ? 0 : Math.sin(p * Math.PI) * 0.9 + p * 0.1
      w.fx.dissolve = ease.inOut(p)
    }, signal)
  }

  ctx(signal) {
    const w = this.world
    const self = this
    return {
      signal,
      world: w,
      pres: this.presCtrl,
      wait: (ms) => sleep(ms, signal),
      tween: (ms, fn) => run(animate(ms, fn, signal)),
      say: (seq, opts = {}) => self.say(seq, opts, signal),
      trigger: (id, hint) => self.trigger(id, hint, signal),
      sfx: (name, o) => audio.sfx(name, o),
      openDoor() {
        const d = w.obj('door')
        if (d && d.openTarget !== 1) w.openDoor(true)
      },
      gesture: (name, s) => w.player.gest(name, s),
      lookDown(ms = 1500) {
        w.lookAt = 'down'
        run(sleep(ms, signal).then(() => (w.lookAt = null)))
      },
      sparkleHead() {
        w.fx.sparkle(w.player.x, w.player.y - 48, 16)
        w.player.head.brow('raise')
      },
      brow: (name) => w.player.head.brow(name),
      wink: () => w.player.head.wink(0.8),
      // Die Figur "dekompiliert" sich selbst: zerfällt in 0/1 und setzt sich wieder zusammen
      selfDecompile(color) {
        w.locked = true
        w.fx.compileFigure(w.player, w.player.x, color).then(() => !signal.aborted && (w.locked = false))
      },
      buttonOn(id) {
        const o = w.obj(id)
        if (!o) return
        o.lit = 1
        o.flow = 1
        self.ui.plateDone(id)
        run(sleep(4500, signal).then(() => (o.flow = 0)))
      },
      compileFigure(id, color) {
        const o = w.obj(id)
        w.locked = true
        w.st.screenBoost = true
        w.fx.compileFigure(w.player, o.x, color).then(() => {
          if (signal.aborted) return // Raum wurde inzwischen gewechselt
          w.locked = false
          w.st.screenBoost = false
        })
      },
    }
  }

  async say(seq, opts, signal) {
    // Cues dürfen asynchron sein; Abbrüche werden still geschluckt
    const cues = (opts.cues || []).map(([i, f, fn]) => [i, f, () => {
      try {
        const r = fn()
        if (r && r.catch) r.catch((e) => !isAbort(e) && console.error(e))
      } catch (e) {
        console.error(e)
      }
    }])
    await this.speech.say(seq, { ...opts, cues, signal })
  }

  async trigger(id, hint, signal) {
    const w = this.world
    this.armed = { id, hint }
    w.arm(id, true)
    w.setHint(id, this.mode === 'manual' ? hint : null)
    audio.sfx('arrow')
    const done = new Promise((resolve, reject) => {
      const off = w.on('activate', (aid) => {
        if (aid === id) {
          off()
          resolve()
        }
      })
      signal.addEventListener('abort', () => { off(); reject(new Aborted()) }, { once: true })
    })
    if (this.mode === 'auto') this.autopilot.perform(id, signal)
    try {
      await done
    } finally {
      w.arm(id, false)
      w.setHint(null)
      this.armed = null
    }
  }

  onClick(id) {
    if (this.paused || !this.armed || this.armed.id !== id || this.autopilot.busy) return
    // Klick auf das aktuelle Ziel: Figur läuft selbst hin und löst aus
    this.autopilot.perform(id, this.signal)
  }

  /** "Weiter": Satz überspringen – oder, wenn niemand spricht, die anstehende Aktion ausführen. */
  next() {
    if (this.paused) return
    if (this.speech.active) this.speech.skip()
    else if (this.armed && !this.autopilot.busy) this.autopilot.perform(this.armed.id, this.signal)
  }

  skipSequence() {
    if (!this.paused && this.speech.active) this.speech.skipAll()
  }

  pause(on) {
    if (on === this.paused) return
    this.paused = on
    clock.paused = on
    if (on) {
      this.speech.pause()
      audio.pauseAll(true)
    } else {
      this.speech.resume()
      audio.pauseAll(false)
    }
    this.ui.paused(on)
  }

  restartRoom() {
    if (this.roomId) this.play(this.roomId)
  }
}
