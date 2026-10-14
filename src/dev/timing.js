// Timing-Rekorder (?timing): Aufnahme abspielen und bei jedem Satzanfang die Leertaste drücken.
// Ergebnis: Zeitmarken für src/data/timings.json. Wird zusätzlich im Browser gespeichert, damit man das
// Ergebnis sofort im Spiel testen kann (gilt dann nur in diesem Browser).
import content from '../data/content.json'
import timings from '../data/timings.json'

const BASE = import.meta.env.BASE_URL
const KEY = 'bf-timings'

export function storedTimings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function openTimingTool() {
  const root = document.createElement('div')
  root.className = 'timing-tool'
  document.body.appendChild(root)
  const saved = storedTimings()
  let seq = content.sequences[0]
  let audio = null
  let marks = []
  let recording = false

  const fmt = (t) => (t == null ? '–' : t.toFixed(2))
  const current = () => saved[seq.id] || timings[seq.id] || null

  function render() {
    const t = recording ? marks : current() || []
    root.innerHTML = `
      <div class="tt-box">
        <h2>Timing-Rekorder</h2>
        <p>Sequenz wählen → <b>Aufnehmen</b> → bei <b>jedem Satzanfang Leertaste</b> drücken (auch beim ersten Satz). <b>Esc</b> bricht ab.</p>
        <div class="tt-seqs">${content.sequences.map((s) => `<button data-seq="${s.id}" class="${s.id === seq.id ? 'on' : ''}">${s.id}</button>`).join('')}</div>
        <p class="tt-status">Datei: <code>public/media/audio/${seq.audio}</code> <span class="tt-audio">wird geprüft …</span></p>
        <div class="tt-actions">
          <button data-act="rec">${recording ? '■ Stopp' : '● Aufnehmen'}</button>
          <button data-act="test">▶ Testen</button>
          <button data-act="copy">JSON kopieren</button>
          <button data-act="clear">Gespeichertes löschen</button>
          <a href="${BASE}">Zurück zum Spiel</a>
        </div>
        <ol class="tt-list">${seq.sentences.map((s, i) => `<li data-i="${i}"><span>${fmt(t[i])}</span>${s}</li>`).join('')}</ol>
        <pre class="tt-json">${JSON.stringify({ [seq.id]: current() }, null, 0)}</pre>
      </div>`
    root.querySelectorAll('[data-seq]').forEach((b) => (b.onclick = () => select(b.dataset.seq)))
    root.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => act(b.dataset.act)))
    checkAudio()
  }

  async function checkAudio() {
    const el = root.querySelector('.tt-audio')
    try {
      const res = await fetch(`${BASE}media/audio/${seq.audio}`, { method: 'HEAD' })
      const ok = res.ok && (res.headers.get('content-type') || '').startsWith('audio')
      el.textContent = ok ? '✓ vorhanden' : '✗ fehlt'
      el.className = `tt-audio ${ok ? 'ok' : 'bad'}`
    } catch {
      el.textContent = '✗ fehlt'
    }
  }

  function select(id) {
    stop()
    seq = content.sequences.find((s) => s.id === id)
    render()
  }

  function stop() {
    recording = false
    audio?.pause()
  }

  function highlight(i) {
    root.querySelectorAll('.tt-list li').forEach((li, k) => li.classList.toggle('cur', k === i))
  }

  function act(a) {
    if (a === 'rec') {
      if (recording) {
        finish()
        return
      }
      marks = []
      recording = true
      audio = new Audio(`${BASE}media/audio/${seq.audio}`)
      audio.play()
      audio.onended = finish
      render()
    }
    if (a === 'test') {
      const t = current()
      if (!t) return
      stop()
      audio = new Audio(`${BASE}media/audio/${seq.audio}`)
      audio.play()
      audio.ontimeupdate = () => {
        let i = 0
        while (i + 1 < t.length && audio.currentTime >= t[i + 1]) i++
        highlight(i)
      }
    }
    if (a === 'copy') navigator.clipboard?.writeText(JSON.stringify(current()))
    if (a === 'clear') {
      delete saved[seq.id]
      localStorage.setItem(KEY, JSON.stringify(saved))
      render()
    }
  }

  function finish() {
    recording = false
    audio?.pause()
    if (marks.length === seq.sentences.length) {
      saved[seq.id] = marks.map((m) => Math.round(m * 100) / 100)
      localStorage.setItem(KEY, JSON.stringify(saved))
    }
    render()
  }

  addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      stop()
      render()
    }
    if (e.code !== 'Space' || !recording) return
    e.preventDefault()
    if (marks.length < seq.sentences.length) {
      marks.push(audio.currentTime)
      highlight(marks.length - 1)
      const li = root.querySelectorAll('.tt-list li span')[marks.length - 1]
      if (li) li.textContent = audio.currentTime.toFixed(2)
    }
  })

  render()
}
