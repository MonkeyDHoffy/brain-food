// Ende-zu-Ende-Tests der Präsentation. Läuft mit beschleunigter Spielzeit (?speed) im Textmodus.
import { test, expect } from '@playwright/test'
import fs from 'node:fs'

const vorgabe = JSON.parse(fs.readFileSync(new URL('../vorgaben/02_Sprechtext/content.json', import.meta.url), 'utf8'))
const ALLE_SAETZE = vorgabe.sequences.flatMap((s) => s.sentences)
// Im Spiel kommt zusätzlich der Jannik-Gag (src/data/extras.json) nach Satz 5 von 03 hinzu
const extras = JSON.parse(fs.readFileSync(new URL('../src/data/extras.json', import.meta.url), 'utf8'))
const IM_SPIEL = vorgabe.sequences.flatMap((s) => s.sentences.map((t, i) => ({ id: `${s.id}:${i}`, t })))
for (const x of extras.sequences) IM_SPIEL.splice(IM_SPIEL.findIndex((e) => e.id === x.insertAfter) + 1, 0, ...x.sentences.map((t) => ({ id: x.id, t })))
const ERWARTET_IM_SPIEL = IM_SPIEL.map((e) => e.t)

function collectErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

test('Eingebauter Sprechtext entspricht wortgleich der Vorgabe', () => {
  const eingebaut = JSON.parse(fs.readFileSync(new URL('../src/data/content.json', import.meta.url), 'utf8'))
  expect(eingebaut.sequences.flatMap((s) => s.sentences)).toEqual(ALLE_SAETZE)
  expect(ALLE_SAETZE.join(' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length).toBeGreaterThan(490)
})

test('Autopilot spielt alle drei Räume bis zum Abspann – jeder Satz (plus Gag) erscheint als Untertitel', async ({ page }) => {
  const errors = collectErrors(page)
  const gesehen = []
  await page.exposeFunction('__untertitel', (t) => gesehen.push(t))
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const t = document.getElementById('subtitleText')?.textContent
      if (t && window.__letzter !== t) {
        window.__letzter = t
        window.__untertitel(t)
      }
    }).observe(document, { subtree: true, childList: true, characterData: true })
  })
  await page.goto('/?auto=1&speed=12&room=1')
  await expect(page.locator('#ending')).toBeVisible({ timeout: 200_000 })
  await expect(page.locator('.lc')).toHaveText(/LEVEL\s*COMPLETE/)
  expect(gesehen).toEqual(ERWARTET_IM_SPIEL)
  expect(errors).toEqual([])
})

test('Bootscreen → Menü → manuell: Mikrofon mit E, Sätze mit N überspringen, Tür führt in Raum 2', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/?speed=4')
  await page.getByRole('button', { name: /EINSCHALTEN/ }).click()
  await expect(page.locator('#menu')).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Enter') // Level 1
  await page.keyboard.press('Enter') // Manuell spielen
  await expect(page.locator('#modeTag')).toHaveText('MANUELL')
  await page.waitForFunction(() => window.__bf.director.armed?.id === 'mic', null, { timeout: 15000 })
  // Zum Mikrofon laufen und E drücken
  await page.keyboard.down('KeyD')
  await page.waitForFunction(() => window.__bf.world.player.x > 226, null, { timeout: 15000 })
  await page.keyboard.up('KeyD')
  await page.waitForFunction(() => Math.abs(window.__bf.world.player.vx) < 1, null, { timeout: 5000 })
  expect(await page.evaluate(() => Math.abs(window.__bf.world.player.x - 252))).toBeLessThan(30)
  await page.keyboard.press('KeyE')
  await page.waitForFunction(() => window.__bf.speech.active?.id === '01-intro', null, { timeout: 10000 })
  // Sätze überspringen, bis die Tür bereitsteht
  for (let i = 0; i < 60; i++) {
    if (await page.evaluate(() => window.__bf.director.armed?.id === 'door')) break
    await page.keyboard.press('KeyN')
    await page.waitForTimeout(250)
  }
  await page.waitForFunction(() => window.__bf.director.armed?.id === 'door', null, { timeout: 15000 })
  await expect(page.locator('.fcard.in')).toHaveCount(4)
  await page.keyboard.down('KeyD')
  await page.waitForFunction(() => window.__bf.director.roomId === 'r2', null, { timeout: 15000 })
  await page.keyboard.up('KeyD')
  expect(errors).toEqual([])
})

test('Menü per Tastatur: „Autopilot starten“ bleibt im Autopiloten (Enter löst keine Übernahme aus)', async ({ page }) => {
  await page.goto('/?speed=2')
  await page.getByRole('button', { name: /EINSCHALTEN/ }).click()
  await expect(page.locator('#menu')).toBeVisible({ timeout: 8000 })
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => window.__bf.speech.active?.id === '01-intro', null, { timeout: 20000 })
  await expect(page.locator('#modeTag')).toHaveText('AUTOPILOT')
})

test('Pause hält Spielzeit und Text an', async ({ page }) => {
  await page.goto('/?room=1&auto=1&speed=2')
  await page.waitForFunction(() => window.__bf.speech.active)
  await page.keyboard.press('KeyP')
  await expect(page.locator('#pause')).toBeVisible()
  const t1 = await page.evaluate(() => window.__bf.clock.t)
  await page.waitForTimeout(1200)
  const t2 = await page.evaluate(() => window.__bf.clock.t)
  expect(t2).toBe(t1)
  await page.keyboard.press('KeyP')
  await expect(page.locator('#pause')).toBeHidden()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.__bf.clock.t)).toBeGreaterThan(t2)
})

test('Fehlendes Bild wird zum beschrifteten Platzhalter', async ({ page }) => {
  await page.route('**/media/images/fusion-01.jpg', (r) => r.fulfill({ status: 404, body: '' }))
  await page.goto('/?room=1&auto=1&speed=6')
  await expect(page.locator('.fcard').first().locator('.ph')).toContainText('fusion-01.jpg', { timeout: 20000 })
})

test('Direktsprung in Raum 2 und 3 per Taste', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/?room=1')
  await page.waitForFunction(() => window.__bf.director.roomId === 'r1')
  await page.keyboard.press('Digit3')
  await page.waitForFunction(() => window.__bf.director.roomId === 'r3')
  await expect(page.locator('#roomName')).toHaveText('Software-Atelier')
  await page.keyboard.press('Digit2')
  await page.waitForFunction(() => window.__bf.director.roomId === 'r2')
  await expect(page.locator('.panel.src')).toBeVisible()
  expect(errors).toEqual([])
})
