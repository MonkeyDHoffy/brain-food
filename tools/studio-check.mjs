// Prüft das Aufnahme-Studio mit einem künstlichen Mikrofon (Testton von Chromium):
// aufnehmen → speichern → Liste/Wellenform → anhören → löschen. Aufruf bei laufendem Dev-Server:
// node tools/studio-check.mjs [screenshot.png]
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await page.goto('http://127.0.0.1:5173/studio.html')
await page.waitForTimeout(1200)
const total = await page.locator('.item').count()
// Satz 1 aufnehmen (2 s), per Leertaste starten und stoppen
await page.keyboard.press('Space')
await page.waitForTimeout(2000)
await page.keyboard.press('Space')
await page.waitForTimeout(1500)
const saved = fs.existsSync('aufnahmen/01-intro') ? fs.readdirSync('aufnahmen/01-intro') : []
const state = await page.locator('.item').first().locator('.state').textContent()
const time = await page.locator('.item').first().locator('.time').textContent()
const selected = await page.locator('.item.sel').getAttribute('data-k')
if (process.argv[2]) await page.screenshot({ path: process.argv[2] })
// aufräumen: Testaufnahme löschen
page.on('dialog', (d) => d.accept())
await page.locator('.item').first().locator('.del').click()
await page.waitForTimeout(800)
const after = fs.existsSync('aufnahmen/01-intro') ? fs.readdirSync('aufnahmen/01-intro') : []
console.log(JSON.stringify({ total, saved, state, time, selected, nachLoeschen: after }))
console.log(errs.length ? errs.join('\n') : 'studio: keine Fehler')
await browser.close()
