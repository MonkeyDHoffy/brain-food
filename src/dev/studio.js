// Aufnahme-Studio (nur lokal im Dev-Server): zeigt jeden Satz des Sprechtexts, nimmt ihn per Mikrofon auf,
// spielt ihn ab und speichert ihn über /__studio nach aufnahmen/<sequenz>/<nr>.webm.
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/pixelify-sans/700.css'
import '../styles/studio.css'
import content from '../data/content.json'
import extras from '../data/extras.json'

const ROOM = { '01-intro': 'Raum 1 · Einstieg', '02-compile': 'Raum 2 · Kompilieren', '03-decompile-cleanroom': 'Raum 2 · Dekompilieren & Clean Room', 'gag-jannik': 'Raum 2 · Gag', '04-artcraft-outlook': 'Raum 3 · ArtCraft & Ausblick' }

// Reihenfolge wie im Vortrag: der Gag steht nach seinem Einfügepunkt
const items = []
for (const seq of content.sequences) {
  seq.sentences.forEach((text, i) => {
    items.push({ seq: seq.id, nr: String(i + 1).padStart(2, '0'), text })
    for (const x of extras.sequences)
      if (x.insertAfter === `${seq.id}:${i}`) x.sentences.forEach((t, k) => items.push({ seq: x.id, nr: String(k + 1).padStart(2, '0'), text: t }))
  })
}

const $ = (id) => document.getElementById(id)
const list = $('list')
let files = {}
let sel = 0
let stream = null
let rec = null
let recItem = null
let recStart = 0
let audioCtx = null
let analyser = null
let player = null
const key = (it) => `${it.seq}/${it.nr}`

// --- Mikrofon ----------------------------------------------------------------------------------------
async function openMic(deviceId) {
  stream?.getTracks().forEach((t) => t.stop())
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: deviceId ? { exact: deviceId } : undefined, channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: false },
  })
  audioCtx ||= new AudioContext()
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024
  audioCtx.createMediaStreamSource(stream).connect(analyser)
  const all = await navigator.mediaDevices.enumerateDevices()
  const devices = all.filter((d) => d.kind === 'audioinput')
  const current = stream.getAudioTracks()[0].getSettings().deviceId
  $('mic').innerHTML = devices.map((d) => `<option value="${d.deviceId}" ${d.deviceId === current ? 'selected' : ''}>${d.label || 'Mikrofon'}</option>`).join('')
  fillOutputs(all, devices.find((d) => d.deviceId === current)?.groupId)
}
$('mic').onchange = (e) => openMic(e.target.value)

// Wiedergabe-Gerät (z. B. das Headset): gespeicherte Wahl, sonst das Gerät, das zum Mikrofon gehört
let outId = ''
function fillOutputs(all, micGroup) {
  const outs = all.filter((d) => d.kind === 'audiooutput')
  if (!outs.length || !('setSinkId' in HTMLMediaElement.prototype)) return
  let saved = ''
  try {
    saved = localStorage.getItem('bf-studio-out') || ''
  } catch {}
  const match = outs.find((d) => d.deviceId === saved) || outs.find((d) => micGroup && d.groupId === micGroup && d.deviceId !== 'default')
  outId = match ? match.deviceId : ''
  $('out').innerHTML = `<option value="">Standard-Ausgabe</option>${outs
    .filter((d) => d.deviceId !== 'default' && d.deviceId !== 'communications')
    .map((d) => `<option value="${d.deviceId}" ${d.deviceId === outId ? 'selected' : ''}>${d.label || 'Lautsprecher'}</option>`)
    .join('')}`
}
$('out').onchange = (e) => {
  outId = e.target.value
  try {
    localStorage.setItem('bf-studio-out', outId)
  } catch {}
  if (player && outId) player.setSinkId(outId).catch(() => {})
}

const buf = new Float32Array(1024)
function meter() {
  if (analyser) {
    analyser.getFloatTimeDomainData(buf)
    let peak = 0
    for (const v of buf) peak = Math.max(peak, Math.abs(v))
    $('level').style.width = `${Math.min(100, peak * 140)}%`
    $('level').classList.toggle('hot', peak > 0.95)
  }
  if (recItem) {
    const el = list.querySelector(`[data-k="${key(recItem)}"] .time`)
    if (el) el.textContent = `${((performance.now() - recStart) / 1000).toFixed(1)} s`
  }
  requestAnimationFrame(meter)
}

// --- Liste --------------------------------------------------------------------------------------------
function render() {
  let lastSeq = ''
  list.innerHTML = items
    .map((it, i) => {
      const head = it.seq !== lastSeq ? `<h2>${ROOM[it.seq] || it.seq}</h2>` : ''
      lastSeq = it.seq
      return `${head}<article class="item" data-i="${i}" data-k="${key(it)}">
        <div class="meta"><b>${it.nr}</b><code>${key(it)}</code><span class="state"></span></div>
        <p class="text">${it.text}</p>
        <div class="ctrl">
          <button type="button" class="rec">● Aufnehmen</button>
          <button type="button" class="play">▶ Anhören</button>
          <button type="button" class="del" title="Aufnahme löschen">Löschen</button>
          <span class="time"></span>
          <canvas class="wave" width="240" height="36"></canvas>
        </div>
      </article>`
    })
    .join('')
  list.querySelectorAll('.item').forEach((el) => {
    const i = Number(el.dataset.i)
    el.onclick = (e) => {
      if (!e.target.closest('button')) select(i)
    }
    el.querySelector('.rec').onclick = () => {
      select(i)
      toggleRec()
    }
    el.querySelector('.play').onclick = () => {
      select(i)
      play(items[i])
    }
    el.querySelector('.del').onclick = () => remove(items[i])
  })
  refresh()
}

function select(i, scroll = true) {
  sel = Math.max(0, Math.min(items.length - 1, i))
  list.querySelectorAll('.item').forEach((el) => el.classList.toggle('sel', Number(el.dataset.i) === sel))
  if (scroll) list.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

async function loadList() {
  const r = await fetch('/__studio/list').then((x) => x.json())
  files = r.files
  $('folder').textContent = `${r.ordner}\\`
  if (r.fertig) {
    $('doneMsg').hidden = false
    $('doneMsg').textContent = `Als fertig markiert am ${new Date(r.fertig.am).toLocaleString('de-DE')}. Weitere Änderungen werden trotzdem gespeichert.`
  }
  refresh()
}

function refresh() {
  let n = 0
  for (const it of items) {
    const el = list.querySelector(`[data-k="${key(it)}"]`)
    const f = files[key(it)]
    if (f) n++
    el.classList.toggle('has', !!f)
    el.querySelector('.state').textContent = f ? '✓ aufgenommen' : 'fehlt'
    el.querySelector('.play').disabled = !f
    el.querySelector('.del').disabled = !f
    if (f && !el.dataset.wave) drawWave(it, el)
  }
  $('count').textContent = `${n} / ${items.length}`
  $('bar').style.width = `${(n / items.length) * 100}%`
  $('ok').disabled = n < items.length
}

async function drawWave(it, el) {
  el.dataset.wave = '1'
  try {
    const data = await fetch(`/__studio/file?seq=${it.seq}&nr=${it.nr}&t=${files[key(it)].mtime}`).then((r) => r.arrayBuffer())
    audioCtx ||= new AudioContext()
    const ab = await audioCtx.decodeAudioData(data)
    const ch = ab.getChannelData(0)
    const cv = el.querySelector('.wave')
    const g = cv.getContext('2d')
    g.clearRect(0, 0, cv.width, cv.height)
    g.fillStyle = '#22654f'
    const step = Math.ceil(ch.length / cv.width)
    let peakAll = 0
    for (let x = 0; x < cv.width; x++) {
      let p = 0
      for (let k = x * step; k < Math.min(ch.length, (x + 1) * step); k++) p = Math.max(p, Math.abs(ch[k]))
      peakAll = Math.max(peakAll, p)
      const h = Math.max(1, p * cv.height)
      g.fillRect(x, (cv.height - h) / 2, 1, h)
    }
    el.querySelector('.time').textContent = `${ab.duration.toFixed(1)} s${peakAll > 0.97 ? ' · zu laut?' : peakAll < 0.08 ? ' · sehr leise' : ''}`
  } catch {
    el.querySelector('.time').textContent = ''
  }
}

// --- Aufnehmen und Abspielen ---------------------------------------------------------------------------
async function toggleRec() {
  if (rec) return stopRec()
  if (!stream) await openMic()
  player?.pause()
  const it = items[sel]
  const type = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
  const chunks = []
  rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 128000 } : undefined)
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  rec.onstop = async () => {
    const blob = new Blob(chunks, { type: rec.mimeType })
    const ext = rec.mimeType.includes('ogg') ? 'ogg' : rec.mimeType.includes('mp4') ? 'mp4' : 'webm'
    rec = null
    await fetch(`/__studio/save?seq=${it.seq}&nr=${it.nr}&ext=${ext}`, { method: 'POST', body: blob })
    const el = list.querySelector(`[data-k="${key(it)}"]`)
    el.classList.remove('recording')
    el.querySelector('.rec').textContent = '● Neu aufnehmen'
    delete el.dataset.wave
    await loadList()
    if ($('autoNext').checked && sel < items.length - 1) select(sel + 1)
  }
  recItem = it
  recStart = performance.now()
  rec.start()
  const el = list.querySelector(`[data-k="${key(it)}"]`)
  el.classList.add('recording')
  el.querySelector('.rec').textContent = '■ Stopp'
}

function stopRec() {
  recItem = null
  rec?.stop()
}

function play(it) {
  if (!files[key(it)]) return
  player?.pause()
  player = new Audio(`/__studio/file?seq=${it.seq}&nr=${it.nr}&t=${files[key(it)].mtime}`)
  const go = () => player.play()
  if (outId && player.setSinkId) player.setSinkId(outId).then(go, go)
  else go()
}

async function remove(it) {
  if (!confirm(`Aufnahme ${key(it)} löschen?`)) return
  await fetch(`/__studio/file?seq=${it.seq}&nr=${it.nr}`, { method: 'DELETE' })
  const el = list.querySelector(`[data-k="${key(it)}"]`)
  delete el.dataset.wave
  el.querySelector('.wave').getContext('2d').clearRect(0, 0, 240, 36)
  el.querySelector('.time').textContent = ''
  await loadList()
}

$('ok').onclick = async () => {
  await fetch('/__studio/done', { method: 'POST' })
  $('doneMsg').hidden = false
  $('doneMsg').textContent = 'Danke! Alles ist gespeichert. Sag Claude Bescheid – dann werden die Aufnahmen bearbeitet und eingebaut.'
}

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return
  if (e.code === 'Space') {
    e.preventDefault()
    toggleRec()
  } else if (e.code === 'Enter') {
    e.preventDefault()
    play(items[sel])
  } else if (e.code === 'ArrowDown') {
    e.preventDefault()
    if (!rec) select(sel + 1)
  } else if (e.code === 'ArrowUp') {
    e.preventDefault()
    if (!rec) select(sel - 1)
  }
})

render()
select(0, false)
loadList()
meter()
openMic().catch(() => {
  $('mic').innerHTML = '<option>Mikrofon-Zugriff erlauben (Aufnehmen klicken)</option>'
})
