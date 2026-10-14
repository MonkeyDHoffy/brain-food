// Bonuslevel im Abspann: "Kopf-Mampf" – ein kleines Pac-Man-artiges Labyrinth. Der Fotokopf frisst Bits,
// Paragrafen-Geister (§) jagen ihn. Läuft von selbst; Pfeiltasten oder WASD übernehmen, nach ein paar
// Sekunden ohne Eingabe spielt es wieder allein.
import { Head } from '../game/head.js'

const MAZE = [
  '#####################',
  '#.........#.........#',
  '#.##.####.#.####.##.#',
  '#...................#',
  '#.##.#.#######.#.##.#',
  '#....#.........#....#',
  '####.####.#.####.####',
  '#...................#',
  '#.##.###.###.###.##.#',
  '#....#....#....#....#',
  '#####################',
]
const COLS = MAZE[0].length
const ROWS = MAZE.length
const START = { x: 10, y: 7 }
const GHOST_STARTS = [{ x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 }]
const GHOST_COLORS = ['#a74d30', '#3f8a6c', '#c9a227']
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }
const PLAYER_SPEED = 4.4 // Felder pro Sekunde
const GHOST_SPEED = 3.1
const IDLE_TO_AUTO = 6 // Sekunden ohne Eingabe, dann übernimmt wieder der Autopilot

const wall = (x, y) => x < 0 || y < 0 || x >= COLS || y >= ROWS || MAZE[y][x] === '#'
const key = (x, y) => y * COLS + x

// Bewegung von Feld zu Feld: Position = zwischen tile und target, Fortschritt t
function mover(x, y, speed) {
  return { tx: x, ty: y, nx: x, ny: y, t: 0, dir: null, speed }
}
const pos = (m) => ({ x: m.tx + (m.nx - m.tx) * m.t, y: m.ty + (m.ny - m.ty) * m.t })

export class HeadMan {
  constructor(canvas, { base = import.meta.env.BASE_URL, onScore } = {}) {
    this.c = canvas
    this.g = canvas.getContext('2d')
    this.head = new Head(base)
    this.onScore = onScore
    this.T = canvas.width / COLS
    this.score = 0
    this.caughtCount = 0
    this.manual = false
    this.want = null
    this.lastInput = -99
    this.time = 0
    this.reset(true)
    this.onKey = (e) => {
      const d = KEYS[e.code]
      if (!d || !this.c.isConnected || this.c.closest('[hidden]')) return
      // Tasten gehören hier dem Spiel, nicht der Präsentationssteuerung
      e.preventDefault()
      e.stopPropagation()
      this.want = d
      this.manual = true
      this.lastInput = this.time
    }
    addEventListener('keydown', this.onKey, true)
  }

  destroy() {
    removeEventListener('keydown', this.onKey, true)
    this.dead = true
  }

  reset(full) {
    if (full) {
      this.pellets = new Set()
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (MAZE[y][x] === '.' && !(x === START.x && y === START.y) && !GHOST_STARTS.some((g) => g.x === x && g.y === y)) this.pellets.add(key(x, y))
    }
    this.p = mover(START.x, START.y, PLAYER_SPEED)
    this.p.face = 1
    this.ghosts = GHOST_STARTS.map((s, i) => ({ ...mover(s.x, s.y, GHOST_SPEED - i * 0.15), color: GHOST_COLORS[i], wait: 0.6 + i * 0.7 }))
    this.state = 'play'
    this.stateT = 0
  }

  // --- Entscheidungen an Feldmitten --------------------------------------------------------------
  canGo(m, d) {
    const [dx, dy] = DIRS[d]
    return !wall(m.tx + dx, m.ty + dy)
  }

  go(m, d) {
    if (!d || !this.canGo(m, d)) return false
    const [dx, dy] = DIRS[d]
    m.dir = d
    m.nx = m.tx + dx
    m.ny = m.ty + dy
    return true
  }

  /** Autopilot: kürzester Weg zum nächsten Bit, Felder nahe den Geistern meiden; sonst fliehen. */
  autoDir() {
    const danger = new Set()
    for (const gh of this.ghosts)
      for (const [x, y] of [[gh.tx, gh.ty], [gh.nx, gh.ny]])
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) danger.add(key(x + dx, y + dy))
    const start = key(this.p.tx, this.p.ty)
    const prev = new Map([[start, null]])
    const queue = [[this.p.tx, this.p.ty]]
    while (queue.length) {
      const [x, y] = queue.shift()
      const k = key(x, y)
      if (k !== start && this.pellets.has(k)) {
        // Weg zurückverfolgen bis zum ersten Schritt
        let cur = k
        while (prev.get(cur) !== start) cur = prev.get(cur)
        const cx = cur % COLS
        const cy = Math.floor(cur / COLS)
        return Object.keys(DIRS).find((d) => this.p.tx + DIRS[d][0] === cx && this.p.ty + DIRS[d][1] === cy)
      }
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx
        const ny = y + dy
        const nk = key(nx, ny)
        if (wall(nx, ny) || prev.has(nk) || danger.has(nk)) continue
        prev.set(nk, k)
        queue.push([nx, ny])
      }
    }
    // Kein sicherer Weg: das Nachbarfeld mit dem größten Abstand zum nächsten Geist
    let best = null
    let bestD = -1
    for (const d of Object.keys(DIRS)) {
      if (!this.canGo(this.p, d)) continue
      const x = this.p.tx + DIRS[d][0]
      const y = this.p.ty + DIRS[d][1]
      const dist = Math.min(...this.ghosts.map((gh) => Math.abs(gh.tx - x) + Math.abs(gh.ty - y)))
      if (dist > bestD) {
        bestD = dist
        best = d
      }
    }
    return best
  }

  ghostDir(gh) {
    const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[gh.dir]
    let opts = Object.keys(DIRS).filter((d) => this.canGo(gh, d) && d !== back)
    if (!opts.length) opts = Object.keys(DIRS).filter((d) => this.canGo(gh, d))
    if (Math.random() < 0.72) {
      // Richtung Kopf
      const dist = (d) => Math.abs(gh.tx + DIRS[d][0] - this.p.tx) + Math.abs(gh.ty + DIRS[d][1] - this.p.ty)
      opts.sort((a, b) => dist(a) - dist(b))
      return opts[0]
    }
    return opts[Math.floor(Math.random() * opts.length)]
  }

  step(m, dt, decide) {
    if (m.nx === m.tx && m.ny === m.ty) {
      // steht: neue Richtung versuchen
      if (!this.go(m, decide())) return
    }
    m.t += m.speed * dt
    while (m.t >= 1) {
      m.t -= 1
      m.tx = m.nx
      m.ty = m.ny
      this.arrive?.(m)
      if (!this.go(m, decide())) {
        m.t = 0
        break
      }
    }
  }

  // --- Ablauf ---------------------------------------------------------------------------------------
  update(dt) {
    this.time += dt
    if (this.manual && this.time - this.lastInput > IDLE_TO_AUTO) this.manual = false
    this.stateT += dt
    if (this.state === 'caught' && this.stateT > 1.4) this.reset(false)
    if (this.state === 'clear' && this.stateT > 2) this.reset(true)

    const p = this.p
    if (this.state === 'play') {
      // Sofort umkehren, wenn gewünscht (fühlt sich bei manueller Steuerung besser an)
      if (this.manual && this.want && p.dir) {
        const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]
        if (this.want === back && (p.nx !== p.tx || p.ny !== p.ty)) {
          ;[p.tx, p.nx] = [p.nx, p.tx]
          ;[p.ty, p.ny] = [p.ny, p.ty]
          p.t = 1 - p.t
          p.dir = back
        }
      }
      this.arrive = (m) => {
        if (m !== p) return
        const k = key(m.tx, m.ty)
        if (this.pellets.delete(k)) {
          this.score += 1
          this.onScore?.(this.score, this.caughtCount)
          if (!this.pellets.size) {
            this.state = 'clear'
            this.stateT = 0
          }
        }
      }
      this.step(p, dt, () => {
        if (this.manual) return this.want && this.canGo(p, this.want) ? this.want : this.canGo(p, p.dir || 'left') ? p.dir : null
        return this.autoDir()
      })
      if (p.dir === 'left') p.face = -1
      if (p.dir === 'right') p.face = 1
      for (const gh of this.ghosts) {
        if (gh.wait > 0) {
          gh.wait -= dt
          continue
        }
        this.step(gh, dt, () => this.ghostDir(gh))
      }
      const pp = pos(p)
      for (const gh of this.ghosts) {
        const gp = pos(gh)
        if (Math.hypot(gp.x - pp.x, gp.y - pp.y) < 0.62) {
          this.state = 'caught'
          this.stateT = 0
          this.caughtCount += 1
          this.onScore?.(this.score, this.caughtCount)
          this.head.brow('skeptic')
          break
        }
      }
    }

    // Kopf: mampfen und mit den Augen der Bewegung folgen
    const moving = this.state === 'play' && (p.nx !== p.tx || p.ny !== p.ty)
    this.head.setTalk(moving ? 0.5 + 0.5 * Math.sin(this.time * 16) : 0.05)
    const [dx, dy] = p.dir ? DIRS[p.dir] : [0, 0]
    this.head.setLook(dx * p.face * 0.8, dy * 0.8 + 0.1)
    this.head.update(dt, { x: dx * 40, y: dy * 40 }, p.face)
  }

  draw() {
    const g = this.g
    const T = this.T
    g.clearRect(0, 0, this.c.width, this.c.height)
    g.fillStyle = '#132420'
    g.fillRect(0, 0, this.c.width, this.c.height)
    // Wände
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        if (!wall(x, y)) continue
        g.fillStyle = '#22654f'
        g.fillRect(x * T + 2, y * T + 2, T - 4, T - 4)
        g.fillStyle = '#2f7a5c'
        g.fillRect(x * T + 2, y * T + 2, T - 4, 4)
        // Verbindungen zu Nachbarwänden schließen
        g.fillStyle = '#22654f'
        if (wall(x + 1, y) && x + 1 < COLS) g.fillRect(x * T + T - 2, y * T + 6, 4, T - 8)
        if (wall(x, y + 1) && y + 1 < ROWS) g.fillRect(x * T + 6, y * T + T - 2, T - 8, 4)
      }
    // Bits
    g.font = `700 ${Math.round(T * 0.42)}px "JetBrains Mono", monospace`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const k of this.pellets) {
      const x = k % COLS
      const y = Math.floor(k / COLS)
      g.fillStyle = (x + y) % 3 === 0 ? '#eef5c9' : '#a4bc67'
      g.fillText((x * 7 + y * 3) % 2 ? '1' : '0', x * T + T / 2, y * T + T / 2 + 1)
    }
    // Geister: Paragrafen
    for (const gh of this.ghosts) {
      const { x, y } = pos(gh)
      const cx = x * T + T / 2
      const cy = y * T + T / 2
      const r = T * 0.42
      g.fillStyle = gh.color
      g.beginPath()
      g.arc(cx, cy - r * 0.15, r, Math.PI, 0)
      g.lineTo(cx + r, cy + r * 0.85)
      for (let i = 0; i < 4; i++) g.lineTo(cx + r - (i + 0.5) * (r / 2), cy + r * (i % 2 ? 0.85 : 0.55))
      g.lineTo(cx - r, cy + r * 0.85)
      g.closePath()
      g.fill()
      g.fillStyle = '#fbfaf3'
      g.font = `700 ${Math.round(T * 0.5)}px "Space Grotesk", sans-serif`
      g.fillText('§', cx, cy + 1)
    }
    // Kopf
    const { x, y } = pos(this.p)
    const caught = this.state === 'caught'
    this.head.draw(g, x * T + T / 2, y * T + T * 0.92, T * 1.5, this.p.face, caught ? 0.55 + 0.45 * Math.sin(this.stateT * 20) : 1)
    // Meldungen
    if (this.state !== 'play') {
      const text = this.state === 'caught' ? 'ABGEMAHNT!' : 'ALLE BITS GEFRESSEN!'
      g.font = `700 ${Math.round(T * 0.9)}px "Pixelify Sans", sans-serif`
      g.fillStyle = 'rgba(19,36,32,.75)'
      g.fillRect(0, this.c.height / 2 - T * 0.8, this.c.width, T * 1.6)
      g.fillStyle = this.state === 'caught' ? '#f2b79a' : '#dcea9e'
      g.fillText(text, this.c.width / 2, this.c.height / 2 + 2)
    }
  }

  /** Eigene Schleife, endet von selbst, sobald die Leinwand verschwindet. */
  start() {
    let last = performance.now()
    const loop = (now) => {
      if (this.dead || !this.c.isConnected || this.c.closest('[hidden]')) {
        this.destroy()
        return
      }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      this.update(dt)
      this.draw()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}
