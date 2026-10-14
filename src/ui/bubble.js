// Sprechblase über der Figur: zeigt kurze Satzabschnitte, tippt sie zügig ein und folgt dem Kopf.
export class Bubble {
  constructor(el, textEl) {
    this.el = el
    this.textEl = textEl
    this.full = ''
    this.shown = 0
    this.cps = 70
    this.acc = 0
  }

  show(text, pop = true) {
    this.full = text
    this.shown = 0
    this.acc = 0
    this.el.hidden = false
    this.el.setAttribute('aria-label', text)
    if (pop) {
      this.el.classList.remove('show')
      void this.el.offsetWidth
      this.el.classList.add('show')
    }
    this.render()
  }

  hide() {
    this.el.hidden = true
    this.full = ''
  }

  update(dt) {
    if (this.el.hidden || this.shown >= this.full.length) return
    this.acc += dt * this.cps
    const n = Math.min(this.full.length, Math.floor(this.acc))
    if (n !== this.shown) {
      this.shown = n
      this.render()
    }
  }

  render() {
    const done = this.shown >= this.full.length
    // Unsichtbarer Rest hält die Blasengröße stabil, damit nichts springt
    this.textEl.innerHTML = `${esc(this.full.slice(0, this.shown))}<span style="visibility:hidden">${esc(this.full.slice(this.shown))}</span>${done ? '' : ''}`
  }

  /** Positioniert die Blase neben dem Kopf (Bühnenkoordinaten des Spielfelds). */
  place(anchor) {
    if (this.el.hidden) return
    const w = this.el.offsetWidth
    const h = this.el.offsetHeight
    let left = anchor.x + 44
    let flip = false
    if (left + w > 1900) {
      left = anchor.x - 66 - w
      flip = true
    }
    left = Math.max(16, left)
    const top = Math.max(76, anchor.top + 30 - h)
    this.el.classList.toggle('flip', flip)
    this.el.style.setProperty('--tail-x', flip ? `${w - 58}px` : '26px')
    this.el.style.transform = ''
    this.el.style.left = `${Math.round(left)}px`
    this.el.style.top = `${Math.round(top)}px`
  }
}

function esc(s) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
}
