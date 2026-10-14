// Sprechen: spielt eine Sequenz Satz für Satz ab – mit Aufnahme (falls vorhanden) oder im Textmodus.
// Jeder Satz erscheint unten als Untertitel und in der Sprechblase in kurzen Abschnitten.
// Cues lösen dabei Aktionen auf der Präsentationsfläche aus: [satzIndex, anteil 0..1, funktion].
import content from '../data/content.json'
import extras from '../data/extras.json'
import timings from '../data/timings.json'
import { audio } from './audio.js'
import { clock, sleep, until } from './clock.js'
import { Babble } from './babble.js'
import { storedTimings } from '../dev/timing.js'
import LIPSYNC from '../data/lipsync.json'
import PACING from '../data/pacing.json'

// Abgestimmter Sprechtext plus Extras (z. B. der Jannik-Gag) mit eigener Aufnahme
export const ALL_SEQUENCES = [...content.sequences, ...extras.sequences]
export const SEQ = Object.fromEntries(ALL_SEQUENCES.map((s) => [s.id, s]))
// Reihenfolge aller Sätze für den Fortschrittsbalken; Extras werden an ihrer Stelle eingefügt
export const ALL_SENTENCES = content.sequences.flatMap((s) => s.sentences.map((_, i) => `${s.id}:${i}`))
for (const x of extras.sequences) {
  const k = ALL_SENTENCES.indexOf(x.insertAfter)
  ALL_SENTENCES.splice(k + 1, 0, ...x.sentences.map((_, i) => `${x.id}:${i}`))
}

const TEXT_CPS = 14.5 // Lesetempo im Textmodus (Zeichen pro Sekunde)
const TEXT_GAP = 450 // Pause zwischen Sätzen im Textmodus (ms)

/** Dateiname der Satz-Aufnahme: audio/<abschnitt>/<nr>.mp3 (Nummer ab 01) */
export const sentenceFile = (id, i) => `${id}/${String(i + 1).padStart(2, '0')}.mp3`

/** Pause nach einem Satz: Standard aus pacing.json, einzelne Sätze können abweichen ("01-intro:3": 600). */
function gapAfter(id, i, withVoice) {
  const own = PACING.after?.[`${id}:${i}`]
  return own ?? (withVoice ? PACING.gapMs ?? 280 : TEXT_GAP)
}

/** Mundöffnung aus der vorberechneten Lautstärkekurve (tools/audio-einbauen.mjs), mit leichter Silbenbetonung. */
function envelopeAt(env, t) {
  const i = Math.floor(t * env.fps)
  if (i < 0 || i >= env.v.length) return 0
  const cur = env.v[i] / 100
  const prev = env.v[Math.max(0, i - 3)] / 100
  return Math.max(0, Math.min(1, cur * 0.85 + Math.max(0, cur - prev) * 1.4))
}
const CHUNK_MAX = 78

export function textDuration(s) {
  return Math.max(2400, (s.length / TEXT_CPS) * 1000 + 400)
}

/** Teilt einen Satz in gut lesbare Abschnitte an Satzzeichen (–, ;, :, Komma). */
export function chunks(sentence) {
  if (sentence.length <= CHUNK_MAX + 12) return [sentence]
  const parts = []
  const re = /[^,;:–]+[,;:]?\s*(–\s*)?/g
  const pieces = sentence.match(re) || [sentence]
  let cur = ''
  for (const p of pieces) {
    if ((cur + p).trim().length > CHUNK_MAX && cur.trim().length > 24) {
      parts.push(cur.trim())
      cur = p
    } else cur += p
  }
  if (cur.trim()) {
    // Sehr kurzen Rest an den Vorgänger hängen
    if (cur.trim().length < 18 && parts.length) parts[parts.length - 1] += ' ' + cur.trim()
    else parts.push(cur.trim())
  }
  // Abschnitte ohne Satzzeichen, die zu lang sind, an einer Wortgrenze nahe der Mitte teilen
  return parts.flatMap((p) => (p.length > CHUNK_MAX + 14 ? splitMiddle(p) : [p]))
}

function splitMiddle(p) {
  const mid = p.length / 2
  // Abstand zur Mitte; vor Bindewörtern wird bevorzugt getrennt
  const score = (i) => {
    const next = p.slice(i + 1)
    const bonus = /^(und|oder|aber|statt)\b/.test(next) ? 20 : /^(ob|dass|wie)\b/.test(next) ? 10 : 0
    return Math.abs(i - mid) - bonus
  }
  let best = -1
  for (let i = 1; i < p.length - 1; i++) if (p[i] === ' ' && (best < 0 || score(i) < score(best))) best = i
  return best > 0 ? [p.slice(0, best), p.slice(best + 1)] : [p]
}

/** Satzanfänge (Sekunden) einer Aufnahme: aus timings.json oder geschätzt nach Textlänge. */
function sentenceTimes(id, seq, duration) {
  const t = storedTimings()[id] || timings[id]
  if (Array.isArray(t) && t.length === seq.sentences.length) return t
  const w = seq.sentences.map((s) => s.length + 22)
  const total = w.reduce((a, b) => a + b, 0)
  let acc = 0
  return w.map((x) => {
    const start = (acc / total) * duration
    acc += x
    return start
  })
}

export class Speech {
  constructor({ bubble, subtitle, onSentence }) {
    this.bubble = bubble
    this.subtitle = subtitle
    this.onSentence = onSentence
    this.babble = new Babble()
    this.active = null
    this.chunkActive = false
    this.mouth = -1
    this.skipFlag = false
    this.skipAllFlag = false
    this.wasPlaying = false
  }

  /** Pro Frame: Mundöffnung bestimmen (-1 = schweigt). */
  update(dt) {
    this.bubble.update(dt)
    if (!this.active) {
      this.mouth = -1
      return
    }
    const { voice: v, env, start } = this.active
    if (v && env) this.mouth = audio.voicePlaying ? envelopeAt(env, audio.voiceTime - (start || 0)) : 0
    else if (v) this.mouth = v.analysed ? audio.voiceLevel() : this.babble.update(dt, audio.voicePlaying)
    else this.mouth = this.babble.update(dt, this.chunkActive)
  }

  skip() {
    if (this.active) this.skipFlag = true
  }

  skipAll() {
    if (this.active) {
      this.skipAllFlag = true
      this.skipFlag = true
    }
  }

  pause() {
    this.wasPlaying = audio.voicePlaying
    audio.pauseVoice()
  }

  resume() {
    if (this.wasPlaying && this.active?.voice) audio.playVoice(this.active.voice, audio.voiceTime)
    this.wasPlaying = false
  }

  async say(id, { from = 0, to, cues = [], signal } = {}) {
    const seq = SEQ[id]
    to = to ?? seq.sentences.length
    // Aufnahme des ganzen Abschnitts (falls vorhanden); höchstens 2,5 s warten, sonst Textmodus
    const whole = audio.hasAudio(seq.audio) ? await audio.voiceWithin(id, seq.audio, 2500) : { ok: false }
    const times = whole.ok ? sentenceTimes(id, seq, whole.duration) : null
    this.skipAllFlag = false
    let lastVoice = null
    try {
      for (let i = from; i < to; i++) {
        if (this.skipAllFlag) {
          cues.filter((c) => c[0] >= i && c[0] < to).forEach((c) => c[2]())
          break
        }
        this.skipFlag = false
        const s = seq.sentences[i]
        // Bevorzugt: eine Aufnahme pro Satz (audio/<abschnitt>/<nr>.mp3) – dann sitzt alles ohne Zeitmarken
        const file = sentenceFile(id, i)
        let v = null
        let start = 0
        let end = 0
        if (audio.hasAudio(file)) {
          const e = await audio.voiceWithin(file, file, 2500)
          if (e.ok) {
            v = e
            end = e.duration
          }
        }
        if (!v && whole.ok) {
          v = whole
          start = times[i]
          end = times[i + 1] ?? whole.duration
        }
        const dur = v ? (end - start) * 1000 : textDuration(s)
        this.active = { id, voice: v, env: v ? LIPSYNC[file.replace('.mp3', '')] : null, start }
        lastVoice = v
        audio.duck(v ? 'voice' : 'text')
        this.onSentence?.(id, i, seq)
        this.subtitle(s, id, i, seq)
        const pending = cues.filter((c) => c[0] === i).sort((a, b) => a[1] - b[1])
        const fire = (progress) => {
          while (pending.length && pending[0][1] <= progress) pending.shift()[2]()
        }
        fire(0)
        if (v) audio.playVoice(v, start)
        const t0 = clock.t
        const progress = () => (v ? (audio.voiceTime - start) / Math.max(0.01, end - start) : (clock.t - t0) / dur)
        const parts = chunks(s)
        const total = parts.reduce((a, p) => a + p.length, 0)
        let acc = 0
        for (let k = 0; k < parts.length; k++) {
          this.bubble.show(parts[k], k === 0)
          this.chunkActive = true
          acc += parts[k].length / total
          const target = acc
          const deadline = t0 + dur * 1.6 + 2500 // Sicherheitsnetz, falls die Aufnahme hängt
          await until(() => {
            const p = progress()
            fire(p)
            return this.skipFlag || p >= target - 0.004 || clock.t > deadline
          }, signal)
          if (this.skipFlag) break
        }
        fire(1)
        this.chunkActive = false
        if (v && v !== whole) audio.pauseVoice()
        // Pause zwischen den Sätzen (einstellbar in src/data/pacing.json)
        if (!this.skipFlag && i < to - 1) await sleep(gapAfter(id, i, !!v), signal)
      }
      if (!lastVoice) await sleep(350, signal)
    } finally {
      this.chunkActive = false
      if (lastVoice) audio.pauseVoice()
      audio.duck(null)
      this.active = null
      this.skipFlag = false
      this.skipAllFlag = false
      this.bubble.hide()
    }
  }
}
