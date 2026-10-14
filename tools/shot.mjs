// Entwicklungshilfe: Screenshots einer Seite nach einer Folge von Aktionen.
// Aufruf: node tools/shot.mjs <url> <ausgabe-präfix> [schritte-json]
// Schritte: [{"wait":ms}, {"key":"KeyE"}, {"down":"KeyD"}, {"up":"KeyD"}, {"shot":"name"}, {"eval":"js"}, {"click":"selector"}]
import { chromium } from '@playwright/test'

const [url, prefix = 'shot', stepsJson = '[{"wait":800},{"shot":"a"}]'] = process.argv.slice(2)
const steps = JSON.parse(stepsJson)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
await page.goto(url)
for (const s of steps) {
  if (s.wait) await page.waitForTimeout(s.wait)
  if (s.key) await page.keyboard.press(s.key)
  if (s.down) await page.keyboard.down(s.down)
  if (s.up) await page.keyboard.up(s.up)
  if (s.click) await page.click(s.click)
  if (s.eval) console.log('eval:', JSON.stringify(await page.evaluate(s.eval)))
  if (s.shot) await page.screenshot({ path: `${prefix}-${s.shot}.png`, clip: s.clip })
}
if (errors.length) console.log(errors.join('\n'))
else console.log('keine Fehler')
await browser.close()
