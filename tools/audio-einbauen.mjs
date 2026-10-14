// Baut die Aufnahmen aus dem Studio ein: aufnahmen/<abschnitt>/<nr>.<webm|ogg|mp4|wav>
//   → public/media/audio/<abschnitt>/<nr>.mp3 (Stille vorn/hinten weg, Brummen raus, Lautstärke angeglichen)
//   → src/data/lipsync.json (Lautstärkekurve je Satz, 50 Werte pro Sekunde, für die Mundbewegung)
// Aufruf: node tools/audio-einbauen.mjs        (nur neue/geänderte)   ·   node tools/audio-einbauen.mjs --alle
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ffmpeg from 'ffmpeg-static'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
// Ordner lassen sich für Tests umlenken (BF_IN, BF_OUT, BF_LIP)
const IN = process.env.BF_IN || path.join(ROOT, 'aufnahmen')
const OUT = process.env.BF_OUT || path.join(ROOT, 'public', 'media', 'audio')
const LIP = process.env.BF_LIP || path.join(ROOT, 'src', 'data', 'lipsync.json')
const FPS = 50
const all = process.argv.includes('--alle')

// Stille vorn/hinten entfernen (-45 dB), tiefes Brummen raus, Lautheit auf -17 LUFS, kurzer Ausklang
const FILTER = [
  'highpass=f=75',
  'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:start_silence=0.06',
  'areverse',
  'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:start_silence=0.12',
  'areverse',
  'loudnorm=I=-17:TP=-1.5:LRA=11',
  'apad=pad_dur=0.08',
].join(',')

function envelope(mp3) {
  // Mono-PCM mit 8 kHz holen und den RMS-Pegel je 20 ms berechnen
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', '8000', '-'], { maxBuffer: 256 * 1024 * 1024 })
  const pcm = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4))
  const win = 8000 / FPS
  const rms = []
  for (let i = 0; i < pcm.length; i += win) {
    let sum = 0
    const end = Math.min(pcm.length, i + win)
    for (let k = i; k < end; k++) sum += pcm[k] * pcm[k]
    rms.push(Math.sqrt(sum / Math.max(1, end - i)))
  }
  // Rauschboden (10. Perzentil) abziehen, auf das 95. Perzentil normieren
  const sorted = [...rms].sort((a, b) => a - b)
  const floor = sorted[Math.floor(sorted.length * 0.1)] || 0
  const top = sorted[Math.floor(sorted.length * 0.95)] || 1
  return rms.map((r) => Math.round(Math.max(0, Math.min(1, (r - floor * 1.4) / Math.max(1e-4, top - floor))) * 100))
}

if (!fs.existsSync(IN)) {
  console.log('Kein Ordner aufnahmen/ gefunden – erst im Studio aufnehmen (tools\\Aufnahme-Studio.cmd).')
  process.exit(0)
}
const lip = fs.existsSync(LIP) ? JSON.parse(fs.readFileSync(LIP, 'utf8')) : {}
let done = 0
let total = 0
for (const seq of fs.readdirSync(IN, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
  fs.mkdirSync(path.join(OUT, seq), { recursive: true })
  for (const f of fs.readdirSync(path.join(IN, seq)).sort()) {
    const m = f.match(/^(\d{2})\.(webm|ogg|mp4|wav|m4a|mp3)$/)
    if (!m) continue
    const src = path.join(IN, seq, f)
    const dst = path.join(OUT, seq, `${m[1]}.mp3`)
    const id = `${seq}/${m[1]}`
    if (!all && fs.existsSync(dst) && fs.statSync(dst).mtimeMs > fs.statSync(src).mtimeMs && lip[id]) continue
    execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', src, '-af', FILTER, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', dst])
    const v = envelope(dst)
    lip[id] = { fps: FPS, v }
    total += v.length / FPS
    done++
    console.log(`✓ ${id}  ${(v.length / FPS).toFixed(1)} s`)
  }
}
// Kurven aufgeräumt sortiert speichern
const sorted = Object.fromEntries(Object.entries(lip).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(LIP, JSON.stringify(sorted))
console.log(done ? `\n${done} Aufnahmen eingebaut (${total.toFixed(0)} s). Lippen-Kurven: src/data/lipsync.json` : 'Nichts Neues zum Einbauen.')
