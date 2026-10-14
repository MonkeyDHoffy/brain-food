// Hilfen für die Präsentationsflächen: Bilder mit Platzhalter, Tipp-Animation, Syntax-Hervorhebung.
import { animate, isAbort } from '../engine/clock.js'
import { audio } from '../engine/audio.js'
import MANIFEST from 'virtual:media'

export const BASE = import.meta.env.BASE_URL
export const MEDIA = `${BASE}media/images/`

export const q = (root, sel) => root.querySelector(sel)

/** Platzhalter-Element: Zugriffe auf ein (noch) nicht vorhandenes Element bleiben folgenlos. */
const noop = () => {}
export const NULL_EL = {
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  style: {},
  dataset: {},
  textContent: '',
  innerHTML: '',
  hidden: true,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: noop,
  remove: noop,
}
export const qa = (root, sel) => [...root.querySelectorAll(sel)]

/** Bild mit automatischem Platzhalter, falls die Datei fehlt. */
export function imgTag(file, alt) {
  if (!MANIFEST.images.includes(file)) return `<div class="ph">Platzhalter<br>${file}<br><small>${alt}</small></div>`
  return `<img src="${MEDIA}${file}" alt="${alt}" data-file="${file}" loading="eager" decoding="async">`
}

export function hydrateImages(root) {
  qa(root, 'img[data-file]').forEach((im) => {
    const fail = () => {
      const ph = document.createElement('div')
      ph.className = 'ph'
      ph.innerHTML = `Platzhalter<br>${im.dataset.file}<br><small>${im.alt}</small>`
      im.replaceWith(ph)
    }
    if (im.complete && im.naturalWidth === 0) fail()
    else im.addEventListener('error', fail, { once: true })
  })
}

/** Führt eine Animation aus, ohne dass ein Abbruch als Fehler hochkommt. */
export function run(promise) {
  promise.catch((e) => {
    if (!isAbort(e)) console.error(e)
  })
  return promise
}

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

/** Einfache C-Hervorhebung (funktioniert auch für halb getippten Text). */
export function highlightC(src) {
  return src
    .split('\n')
    .map((line) => {
      const ci = line.indexOf('//')
      const code = ci >= 0 ? line.slice(0, ci) : line
      const cm = ci >= 0 ? line.slice(ci) : ''
      let h = esc(code)
        .replace(/\b(int|return|void)\b/g, '<span class="kw">$1</span>')
        .replace(/\b([a-z_][a-z0-9_]*)(?=\()/gi, (m) => (m === 'int' || m === 'return' ? m : `<span class="fn">${m}</span>`))
      if (cm) h += `<span class="cm">${esc(cm)}</span>`
      return h
    })
    .join('\n')
}

/** Tippt Text in ein Element (Spielzeit, pausierbar). */
export function typeInto(el, text, { cps = 30, render = esc, signal, sound = true, caret = true } = {}) {
  let last = 0
  return animate((text.length / cps) * 1000, (p) => {
    const n = Math.round(p * text.length)
    el.innerHTML = render(text.slice(0, n)) + (caret && p < 1 ? '<span class="cur"></span>' : '')
    if (sound && n - last >= 3) {
      last = n
      audio.sfx('type', { jitter: 0.15 })
    }
  }, signal)
}
