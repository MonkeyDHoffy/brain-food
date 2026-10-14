// Ton: Geräusche (SFX), Hintergrundmusik und die selbst eingesprochenen Sprachaufnahmen.
// Alles startet erst nach einer bewussten Nutzeraktion (Einschalten im Bootscreen).
// Fehlende Dateien sind kein Fehler: Dann bleibt es still bzw. der Textmodus übernimmt.
import MEDIA from 'virtual:media'

const BASE = import.meta.env.BASE_URL

const SFX = {
  'step-1': 0.22, 'step-2': 0.22, 'step-3': 0.22,
  jump: 0.35, land: 0.3, button: 0.55, mic: 0.45, door: 0.45, glitch: 0.35,
  pop: 0.4, type: 0.12, bits: 0.3, sparkle: 0.35, arrow: 0.3, complete: 0.5,
  boot: 0.45, 'ui-move': 0.3, 'ui-select': 0.4, whoosh: 0.3,
}
const MUSIC_VOL = 0.2
const MUSIC_DUCK_VOICE = 0.07
const MUSIC_DUCK_TEXT = 0.14

let ctx = null
let master, sfxBus, musicBus, voiceBus, analyser
const buffers = new Map()
let musicEl = null
let musicOn = true
let musicTarget = MUSIC_VOL
const voices = new Map() // seqId -> Lade-Versprechen
let currentVoice = null
const levelBuf = new Float32Array(1024)

function setGain(node, v, t = 0.25) {
  if (!ctx || !node) return
  node.gain.cancelScheduledValues(ctx.currentTime)
  node.gain.setTargetAtTime(v, ctx.currentTime, t / 3)
}

async function loadSfx(name) {
  if (!MEDIA.sfx.includes(`${name}.mp3`)) return
  try {
    const res = await fetch(`${BASE}media/sfx/${name}.mp3`)
    if (!res.ok || !(res.headers.get('content-type') || '').includes('audio')) return
    const buf = await ctx.decodeAudioData(await res.arrayBuffer())
    buffers.set(name, buf)
  } catch {
    /* Datei fehlt oder ist kaputt: dann eben still */
  }
}

/** Prüft, ob eine Mediendatei wirklich existiert (Vite liefert sonst index.html aus). */
export async function mediaExists(url, kind = 'audio') {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok && (res.headers.get('content-type') || '').startsWith(kind)
  } catch {
    return false
  }
}

const entries = new Map() // seqId -> Eintrag {ok, el, duration, analysed}

/** Lädt eine Aufnahme. Der Eintrag wird sofort angelegt und später auf ok gesetzt, sobald die Datei bereit ist. */
function loadVoice(seqId, file) {
  const entry = { ok: false, el: null, duration: 0, analysed: false }
  entries.set(seqId, entry)
  if (!MEDIA.audio.includes(file)) return Promise.resolve(entry)
  const el = new Audio(`${BASE}media/audio/${file}`)
  el.preload = 'auto'
  entry.el = el
  return new Promise((resolve) => {
    const ready = () => {
      if (!entry.ok && isFinite(el.duration) && el.duration > 0) {
        if (ctx && !entry.analysed) {
          ctx.createMediaElementSource(el).connect(analyser)
          entry.analysed = true
        }
        entry.duration = el.duration
        entry.ok = true
      }
      resolve(entry)
    }
    el.addEventListener('loadedmetadata', ready, { once: true })
    el.addEventListener('error', () => resolve(entry), { once: true })
    if (el.readyState >= 1) ready()
  })
}

export const audio = {
  get ready() {
    return !!ctx
  },
  get musicOn() {
    return musicOn
  },

  /** Muss aus einem Klick/Tastendruck heraus aufgerufen werden. */
  unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume()
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.connect(ctx.destination)
    sfxBus = ctx.createGain()
    sfxBus.connect(master)
    musicBus = ctx.createGain()
    musicBus.gain.value = 0
    musicBus.connect(master)
    voiceBus = ctx.createGain()
    voiceBus.connect(master)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.connect(voiceBus)
    Object.keys(SFX).forEach(loadSfx)
  },

  sfx(name, { vol = 1, rate = 1, jitter = 0 } = {}) {
    if (!ctx) return
    const buf = buffers.get(name)
    if (!buf) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter)
    const g = ctx.createGain()
    g.gain.value = (SFX[name] ?? 0.4) * vol
    src.connect(g).connect(sfxBus)
    src.start()
  },

  async startMusic() {
    if (!ctx || musicEl) return
    const url = `${BASE}media/music/loop.mp3`
    if (!MEDIA.music.includes('loop.mp3')) return
    musicEl = new Audio(url)
    musicEl.loop = true
    musicEl.preload = 'auto'
    ctx.createMediaElementSource(musicEl).connect(musicBus)
    if (musicOn) {
      musicEl.play().catch(() => {})
      setGain(musicBus, musicTarget, 1.5)
    }
  },

  setMusic(on) {
    musicOn = on
    if (!musicEl) return
    if (on) {
      musicEl.play().catch(() => {})
      setGain(musicBus, musicTarget, 0.8)
    } else {
      setGain(musicBus, 0, 0.4)
      setTimeout(() => !musicOn && musicEl.pause(), 500)
    }
  },

  /** Musik leiser, solange gesprochen wird. mode: 'voice' | 'text' | null */
  duck(mode) {
    musicTarget = mode === 'voice' ? MUSIC_DUCK_VOICE : mode === 'text' ? MUSIC_DUCK_TEXT : MUSIC_VOL
    if (musicOn) setGain(musicBus, musicTarget, 0.6)
  },

  pauseAll(paused) {
    if (!ctx) return
    if (paused) {
      currentVoice?.el.pause()
      musicEl?.pause()
    } else if (musicOn) musicEl?.play().catch(() => {})
  },

  // --- Sprachaufnahmen -------------------------------------------------------------------------
  /** Lädt die Aufnahme einer Sequenz, falls vorhanden. Liefert {ok, duration}. */
  async voice(seqId, file) {
    // Das Lade-Versprechen wird gemerkt (nicht ein vorläufiges "fehlt"). Wird die Datei erst spät fertig,
    // setzt der Eintrag ok nachträglich – der nächste Abspielversuch nutzt sie dann.
    if (!voices.has(seqId)) voices.set(seqId, loadVoice(seqId, file))
    return voices.get(seqId)
  },

  /** Wie voice(), wartet aber höchstens ms und liefert dann den (evtl. noch nicht fertigen) Eintrag. */
  async voiceWithin(seqId, file, ms) {
    const p = this.voice(seqId, file)
    const late = new Promise((r) => setTimeout(() => r(entries.get(seqId) || { ok: false }), ms))
    return Promise.race([p, late])
  },

  /** Spielt eine Aufnahme ab Sekunde from. Stoppt vorher jede andere Aufnahme. */
  playVoice(entry, from) {
    if (!entry?.ok) return
    if (ctx && ctx.state === 'suspended') ctx.resume()
    if (currentVoice && currentVoice !== entry) currentVoice.el.pause()
    currentVoice = entry
    if (Math.abs(entry.el.currentTime - from) > 0.2) entry.el.currentTime = from
    entry.el.play().catch(() => {})
  },

  pauseVoice() {
    currentVoice?.el.pause()
  },

  stopVoice() {
    if (!currentVoice) return
    currentVoice.el.pause()
    currentVoice = null
  },

  get voiceTime() {
    return currentVoice ? currentVoice.el.currentTime : 0
  },

  get voicePlaying() {
    return !!currentVoice && !currentVoice.el.paused
  },

  /** Lautstärke der laufenden Aufnahme (0..1) für die Mundbewegung. */
  voiceLevel() {
    if (!analyser || !currentVoice || currentVoice.el.paused) return 0
    analyser.getFloatTimeDomainData(levelBuf)
    let sum = 0
    for (let i = 0; i < levelBuf.length; i++) sum += levelBuf[i] * levelBuf[i]
    const rms = Math.sqrt(sum / levelBuf.length)
    return Math.max(0, Math.min(1, (rms - 0.015) * 7))
  },
}
