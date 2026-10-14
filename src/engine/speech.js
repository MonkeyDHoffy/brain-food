// Sprechen: spielt eine Sequenz Satz für Satz ab – mit Aufnahme (falls vorhanden) oder im Textmodus.
// Jeder Satz erscheint unten als Untertitel und in der Sprechblase in kurzen Abschnitten.
// Cues lösen dabei Aktionen auf der Präsentationsfläche aus: [satzIndex, anteil 0..1, funktion].
import content from '../data/content.json'
import timings from '../data/timings.json'
import { audio } from './audio.js'
import { clock, sleep, until } from './clock.js'
import { Babble } from './babble.js'

export const SEQ = Object.fromEntries(content.sequences.map((s) => [s.id, s]))
export const ALL_SENTENCES = content.sequences.flatMap((s) => s.sentences.map((_, i) => `${s.id}:${i}`))

const TEXT_CPS = 14.5 // Lesetempo im Textmodus (Zeichen pro Sekunde)
const TEXT_GAP = 450 // Pause zwischen Sätzen im Textmodus (ms)
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
  const t = timings[id]
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
    if (this.active.voice) this.mouth = audio.voiceLevel()
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
    const v = await audio.voice(id, seq.audio)
    const times = v.ok ? sentenceTimes(id, seq, v.duration) : null
    this.active = { id, voice: v.ok ? v : null }
    this.skipAllFlag = false
    audio.duck(v.ok ? 'voice' : 'text')
    try {
      for (let i = from; i < to; i++) {
        if (this.skipAllFlag) {
          cues.filter((c) => c[0] >= i && c[0] < to).forEach((c) => c[2]())
          break
        }
        this.skipFlag = false
        const s = seq.sentences[i]
        const start = times ? times[i] : 0
        const end = times ? (times[i + 1] ?? v.duration) : 0
        const dur = times ? (end - start) * 1000 : textDuration(s)
        this.onSentence?.(id, i, seq)
        this.subtitle(s, id, i, seq)
        const pending = cues.filter((c) => c[0] === i).sort((a, b) => a[1] - b[1])
        const fire = (progress) => {
          while (pending.length && pending[0][1] <= progress) pending.shift()[2]()
        }
        fire(0)
        if (v.ok) audio.playVoice(v, start)
        const t0 = clock.t
        const progress = () => (v.ok ? (audio.voiceTime - start) / Math.max(0.01, end - start) : (clock.t - t0) / dur)
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
        if (!v.ok && !this.skipFlag && i < to - 1) await sleep(TEXT_GAP, signal)
      }
      if (!v.ok) await sleep(350, signal)
    } finally {
      this.chunkActive = false
      if (v.ok) audio.pauseVoice()
      audio.duck(null)
      this.active = null
      this.skipFlag = false
      this.skipAllFlag = false
      this.bubble.hide()
    }
  }
}
