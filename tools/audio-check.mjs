// Prüft die eingebauten Aufnahmen im echten Ablauf: alle drei Räume parallel im Autopiloten (Echtzeit).
// Misst je Satz: spielt eine Aufnahme? bewegt sich der Mund? und die Dauer je Raum.
// Aufruf bei laufendem Dev-Server: node tools/audio-check.mjs
import { chromium } from '@playwright/test'

const BASE = process.env.BF_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })

async function room(n) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  await page.goto(`${BASE}/?room=${n}&auto=1`)
  const t0 = Date.now()
  // Pro Frame protokollieren: aktueller Satz, Aufnahme ja/nein, Mundöffnung
  const log = await page.evaluate(
    (room) =>
      new Promise((resolve) => {
        const rows = {}
        const start = performance.now()
        const tick = () => {
          const s = window.__bf?.speech
          const a = s?.active
          if (a) {
            const k = `${a.id}:${document.getElementById('subtitleMeta').textContent.match(/Satz (\d+)/)?.[1]}`
            const r = (rows[k] ||= { voice: !!a.voice, frames: 0, open: 0, t: Math.round((performance.now() - start) / 100) / 10 })
            r.frames++
            if (s.mouth > 0.15) r.open++
          }
          const done = room < 3 ? window.__bf.director.roomId !== `r${room}` : !document.getElementById('ending').hidden
          if (done || performance.now() - start > 240000) resolve(rows)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
    n,
  )
  const secs = ((Date.now() - t0) / 1000).toFixed(0)
  await page.close()
  return { n, secs, log, errs }
}

const results = await Promise.all([1, 2, 3].map(room))
for (const r of results) {
  console.log(`\nRaum ${r.n}: ${r.secs} s bis zur nächsten Tür${r.n === 3 ? ' (Abspann)' : ''}`)
  for (const [k, v] of Object.entries(r.log)) console.log(`  ${k.padEnd(28)} ab ${String(v.t).padStart(5)} s  Aufnahme: ${v.voice ? 'ja ' : 'NEIN'}  Mund offen: ${Math.round((v.open / Math.max(1, v.frames)) * 100)}%`)
  console.log(r.errs.length ? `  Fehler: ${r.errs.join(' | ')}` : '  keine Fehler')
}
await browser.close()
