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
// Stimmfilter (Taste V): standardmäßig an, ausgeschaltet bleibt er nur, wenn man ihn abgeschaltet hat
let voiceFxOn = true
try {
  voiceFxOn = localStorage.getItem('bf-voicefx') !== '0'
} catch {}
let fxDry, fxWet
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

// Kurzer, gedämpfter Nachhall aus gefiltertem Rauschen (kleiner Raum, kein Hall-Effekt)
function roomImpulse(c, sec) {
  const len = Math.floor(c.sampleRate * sec)
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let lp = 0
    for (let i = 0; i < len; i++) {
      lp += (Math.random() * 2 - 1 - lp) * 0.3
      d[i] = lp * (1 - i / len) ** 3
    }
  }
  return buf
}

// Pegelausgleich, damit der Filter nicht lauter oder leiser klingt (gemessen über acht Aufnahmen)
const VOICE_FX_MAKEUP = 0.83

/**
 * Stimmfilter: macht die Headset-Aufnahmen wärmer und weicher. Gemessen (Terzbänder über acht Aufnahmen,
 * verglichen mit typischer Sprache) sind sie bei 160–250 Hz etwa 3 dB zu dünn und bei 2–6 kHz etwa 5–6 dB
 * zu präsent (klingt hart); über 7,5 kHz ist nichts (Mikrofon mit 16 kHz). Also: Wärme um 200 Hz dazu,
 * den harten Bereich ab 2 kHz zurück, sanfte Kompression und ein Hauch Raum. Baut die Kette von input nach out.
 */
export function buildVoiceFx(c, input, out) {
  const f = (type, freq, gain = 0, Q = 0.7) => {
    const n = c.createBiquadFilter()
    n.type = type
    n.frequency.value = freq
    n.gain.value = gain
    n.Q.value = Q
    return n
  }
  // vor der Kompression Tiefen aufräumen und wärmen, danach die Härte zähmen
  // (die Kompression würde die Höhen sonst relativ wieder anheben)
  const pre = [f('highpass', 80), f('peaking', 200, 3, 0.8)]
  const post = [f('peaking', 1900, -1.5, 1), f('highshelf', 3200, -3.5)]
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -22
  comp.knee.value = 16
  comp.ratio.value = 2.5
  comp.attack.value = 0.008
  comp.release.value = 0.2
  const room = c.createConvolver()
  room.buffer = roomImpulse(c, 0.5)
  const roomGain = c.createGain()
  roomGain.gain.value = 0.1
  const makeup = c.createGain()
  makeup.gain.value = VOICE_FX_MAKEUP
  let node = input
  for (const n of [...pre, comp, ...post]) node = node.connect(n)
  node.connect(makeup)
  node.connect(room).connect(roomGain).connect(makeup)
  makeup.connect(out)
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
  get voiceFxOn() {
    return voiceFxOn
  },

  /** Stimmfilter an/aus – blendet weich über, damit nichts knackt. */
  setVoiceFx(on) {
    voiceFxOn = on
    try {
      localStorage.setItem('bf-voicefx', on ? '1' : '0')
    } catch {}
    setGain(fxDry, on ? 0 : 1, 0.15)
    setGain(fxWet, on ? 1 : 0, 0.15)
  },

  /** Gibt es diese Aufnahme (Pfad unter public/media/audio/)? */
  hasAudio(file) {
    return MEDIA.audio.includes(file)
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
    // Stimme: trocken oder durch den Stimmfilter (beide Wege liegen an, umgeschaltet wird per Lautstärke)
    fxDry = ctx.createGain()
    fxDry.gain.value = voiceFxOn ? 0 : 1
    analyser.connect(fxDry).connect(voiceBus)
    fxWet = ctx.createGain()
    fxWet.gain.value = voiceFxOn ? 1 : 0
    buildVoiceFx(ctx, analyser, fxWet)
    fxWet.connect(voiceBus)
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
    // vor dem Ton-Freischalten geladen: jetzt noch an die Stimm-Kette hängen
    if (ctx && !entry.analysed) {
      ctx.createMediaElementSource(entry.el).connect(analyser)
      entry.analysed = true
    }
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
