// Vite-Konfiguration. Das kleine Plugin erzeugt beim Bauen eine Liste der vorhandenen Mediendateien
// (import MEDIA from 'virtual:media'). So fragt die Seite nur Dateien an, die es wirklich gibt –
// fehlende Audios erzeugen keine 404-Meldungen in der Konsole.
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

const ID = 'virtual:media'
const RESOLVED = '\0' + ID
const dir = (d) => {
  const p = path.resolve('public/media', d)
  return fs.existsSync(p) ? fs.readdirSync(p).filter((f) => !f.startsWith('.')) : []
}

function mediaManifest() {
  return {
    name: 'media-manifest',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load: (id) => (id === RESOLVED ? `export default ${JSON.stringify({ audio: dir('audio'), music: dir('music'), images: dir('images'), sfx: dir('sfx') })}` : null),
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

export default defineConfig({
  base: './',
  plugins: [mediaManifest()],
  build: { assetsInlineLimit: 0 },
})
