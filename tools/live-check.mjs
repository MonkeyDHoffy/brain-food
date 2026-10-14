// Smoke-Test der Live-Seite: anonym gesperrt, mit Passwort ladbar, ohne Konsolenfehler.
// Aufruf: node tools/live-check.mjs [screenshot.png]   (Passwort aus .zugang.local.txt)
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const SITE = 'https://brainfood.hoffja.de'
const pw = fs.readFileSync(new URL('../.zugang.local.txt', import.meta.url), 'utf8').match(/^Passwort: (.+)$/m)?.[1]?.trim()
if (!pw) throw new Error('Passwort nicht in .zugang.local.txt gefunden')

const anon = await fetch(SITE + '/media/images/fusion-01.jpg')
console.log(`anonym Bild: ${anon.status} ${anon.status === 401 ? 'ok' : 'FEHLER: muss 401 sein'}`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, httpCredentials: { username: 'brainfood', password: pw } })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('response', (r) => r.status() >= 400 && errs.push(`${r.status()} ${r.url()}`))
await page.goto(`${SITE}/?room=2&auto=1&speed=3`)
await page.waitForTimeout(9000)
if (process.argv[2]) await page.screenshot({ path: process.argv[2] })
console.log(errs.length ? errs.join('\n') : 'live: keine Fehler')
await browser.close()
