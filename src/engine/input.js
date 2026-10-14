// Tastatur → Aktionen. Der Autopilot hält dieselben Aktionen virtuell gedrückt, damit Figur und Physik
// in beiden Modi identisch reagieren. Ist die Figur gesperrt (Raumwechsel, Effekte), zählen nur die
// virtuellen Eingaben des Autopiloten.
const MOVE = {
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyW: 'jump', ArrowUp: 'jump',
  KeyE: 'interact', Enter: 'interact',
}

const down = new Set()
const virtual = new Set()
const pressedKey = new Set()
const pressedVirtual = new Set()
const listeners = new Set()

export const input = {
  enabled: false, // Spielsteuerung aktiv (nicht in Menüs)
  isDown(a, virtualOnly = false) {
    return (!virtualOnly && this.enabled && down.has(a)) || virtual.has(a)
  },
  /** Kante: wurde die Aktion seit dem letzten Frame gedrückt? */
  take(a, virtualOnly = false) {
    const had = pressedVirtual.has(a) || (!virtualOnly && pressedKey.has(a))
    pressedVirtual.delete(a)
    pressedKey.delete(a)
    return had
  },
  hold(a, on) {
    if (on) {
      if (!virtual.has(a)) pressedVirtual.add(a)
      virtual.add(a)
    } else virtual.delete(a)
  },
  tap(a) {
    pressedVirtual.add(a)
  },
  releaseVirtual() {
    virtual.clear()
  },
  endFrame() {
    pressedKey.clear()
    pressedVirtual.clear()
  },
  /** Meldet echte Bewegungs-Tastendrücke (für die Übernahme aus dem Autopiloten). */
  onManual(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

// Tasten, die an Eingabefelder oder fokussierte Bedienknöpfe gehen, steuern nicht die Figur
function isTyping(e) {
  const t = e.target
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.isContentEditable)
}

addEventListener('keydown', (e) => {
  if (isTyping(e)) return
  const a = MOVE[e.code]
  if (!a || !input.enabled) return
  // Leertaste/Pfeile sollen die Seite nicht scrollen und keine fokussierten Knöpfe auslösen
  e.preventDefault()
  if (e.repeat) return
  down.add(a)
  pressedKey.add(a)
  for (const fn of listeners) fn(a)
})

addEventListener('keyup', (e) => {
  const a = MOVE[e.code]
  if (a) down.delete(a)
})

addEventListener('blur', () => down.clear())
