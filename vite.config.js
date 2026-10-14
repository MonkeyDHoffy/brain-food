// Vite-Konfiguration mit zwei kleinen Plugins:
// 1. media-manifest: Liste der vorhandenen Mediendateien (import MEDIA from 'virtual:media'). So fragt die Seite nur
//    Dateien an, die es wirklich gibt – fehlende Audios erzeugen keine 404-Meldungen in der Konsole.
//    Audios dürfen in Unterordnern liegen (eine Datei pro Satz: audio/<sequenz>/<nr>.mp3).
// 2. aufnahme-studio: Speichert im Dev-Server die Aufnahmen aus studio.html nach aufnahmen/<sequenz>/<nr>.<endung>.
//    Nur lokal (npm run dev), nicht im fertigen Build.
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const ID = 'virtual:media'
const RESOLVED = '\0' + ID

function list(d, recursive = false, prefix = '') {
  const p = path.resolve('public/media', d)
  if (!fs.existsSync(p)) return []
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.')) return []
    if (e.isDirectory()) return recursive ? list(path.join(d, e.name), true, `${prefix}${e.name}/`) : []
    return [`${prefix}${e.name}`]
  })
}

function mediaManifest() {
  return {
    name: 'media-manifest',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load: (id) =>
      id === RESOLVED
        ? `export default ${JSON.stringify({ audio: list('audio', true), music: list('music'), images: list('images'), sfx: list('sfx') })}`
        : null,
    configureServer(server) {
      const refresh = (file) => {
        if (!file.replace(/\\/g, '/').includes('public/media/')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

// --- Aufnahme-Studio ---------------------------------------------------------------------------------
const REC = path.resolve('aufnahmen')
const TYPES = { webm: 'audio/webm', ogg: 'audio/ogg', mp4: 'audio/mp4', wav: 'audio/wav' }
const SEQ_OK = /^[a-z0-9-]+$/
const NR_OK = /^\d{2}$/

function studio() {
  return {
    name: 'aufnahme-studio',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__studio', (req, res) => {
        const url = new URL(req.url, 'http://x')
        const seq = url.searchParams.get('seq') || ''
        const nr = url.searchParams.get('nr') || ''
        const send = (code, body, type = 'application/json') => {
          res.statusCode = code
          res.setHeader('Content-Type', type)
          res.setHeader('Cache-Control', 'no-store')
          res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
        }
        const fileFor = () => {
          if (!SEQ_OK.test(seq) || !NR_OK.test(nr)) return null
          const d = path.join(REC, seq)
          if (!fs.existsSync(d)) return null
          const f = fs.readdirSync(d).find((x) => x.startsWith(`${nr}.`))
          return f ? path.join(d, f) : null
        }
        try {
          if (url.pathname === '/list' && req.method === 'GET') {
            const files = {}
            if (fs.existsSync(REC))
              for (const s of fs.readdirSync(REC, { withFileTypes: true }).filter((e) => e.isDirectory()))
                for (const f of fs.readdirSync(path.join(REC, s.name))) {
                  const st = fs.statSync(path.join(REC, s.name, f))
                  files[`${s.name}/${f.split('.')[0]}`] = { size: st.size, mtime: st.mtimeMs, ext: f.split('.').pop() }
                }
            const fertig = fs.existsSync(path.join(REC, 'FERTIG.json')) ? JSON.parse(fs.readFileSync(path.join(REC, 'FERTIG.json'), 'utf8')) : null
            return send(200, { files, fertig, ordner: REC })
          }
          if (url.pathname === '/save' && req.method === 'POST') {
            const ext = url.searchParams.get('ext') || 'webm'
            if (!SEQ_OK.test(seq) || !NR_OK.test(nr) || !TYPES[ext]) return send(400, { fehler: 'ungültig' })
            const chunks = []
            req.on('data', (c) => chunks.push(c))
            req.on('end', () => {
              const d = path.join(REC, seq)
              fs.mkdirSync(d, { recursive: true })
              for (const f of fs.readdirSync(d)) if (f.startsWith(`${nr}.`)) fs.unlinkSync(path.join(d, f))
              fs.writeFileSync(path.join(d, `${nr}.${ext}`), Buffer.concat(chunks))
              send(200, { ok: true })
            })
            return
          }
          if (url.pathname === '/file' && req.method === 'GET') {
            const f = fileFor()
            if (!f) return send(404, { fehler: 'fehlt' })
            return send(200, fs.readFileSync(f), TYPES[f.split('.').pop()] || 'application/octet-stream')
          }
          if (url.pathname === '/file' && req.method === 'DELETE') {
            const f = fileFor()
            if (f) fs.unlinkSync(f)
            return send(200, { ok: true })
          }
          if (url.pathname === '/done' && req.method === 'POST') {
            fs.mkdirSync(REC, { recursive: true })
            fs.writeFileSync(path.join(REC, 'FERTIG.json'), JSON.stringify({ am: new Date().toISOString() }, null, 2))
            return send(200, { ok: true })
          }
          send(404, { fehler: 'unbekannt' })
        } catch (e) {
          send(500, { fehler: String(e) })
        }
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [mediaManifest(), studio()],
  build: { assetsInlineLimit: 0 },
})
