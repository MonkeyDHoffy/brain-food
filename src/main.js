// Einstieg: Bühne skalieren, Module verbinden, Hauptschleife starten, Tastenkürzel.
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/500.css'
import '@fontsource/pixelify-sans/600.css'
import '@fontsource/pixelify-sans/700.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import './styles/main.css'
import './styles/pres.css'

import { clock } from './engine/clock.js'
import { input } from './engine/input.js'
import { audio } from './engine/audio.js'
import { Speech } from './engine/speech.js'
import { World } from './game/world.js'
import { Bubble } from './ui/bubble.js'
import { UI } from './ui/ui.js'
import { Pres } from './pres/index.js'
import { Director } from './story/director.js'
import { openTimingTool } from './dev/timing.js'
import { BODY_STYLES, BODY_LABELS } from './game/body.js'

const params = new URLSearchParams(location.search)
const $ = (id) => document.getElementById(id)

// --- Bühne auf das Fenster skalieren ---------------------------------------------------------------------
const stage = $('stage')
const canvas = $('world')
let scale = 1
function fit() {
  scale = Math.min(innerWidth / 1920, innerHeight / 1080)
  stage.style.transform = `scale(${scale}) translate(-50%, -50%)`
  const dpr = Math.min(2, devicePixelRatio || 1)
  world.resize(Math.round(1920 * scale * dpr), Math.round(456 * scale * dpr))
}

// --- Module ------------------------------------------------------------------------------------------------
const world = new World(canvas, $('fieldLabels'))
const bubble = new Bubble($('bubble'), $('bubbleText'))
const ui = new UI()
const pres = new Pres($('pres'))
const speech = new Speech({
  bubble,
  subtitle: (text, id, i, seq) => ui.subtitle(text, id, i, seq),
})
world.mouth = () => speech.mouth
const director = new Director({ world, speech, pres, ui })
addEventListener('resize', fit)
fit()

if (params.has('speed')) clock.speed = Math.max(0.25, Math.min(20, Number(params.get('speed')) || 1))
// Für Tests: Zustand von außen lesbar
window.__bf = { world, director, speech, clock, audio }

// --- Hauptschleife --------------------------------------------------------------------------------------
let last = performance.now()
function frame(now) {
  const real = Math.min(100, now - last)
  last = now
  const dt = clock.tick(real)
  if (!director.paused) {
    world.update(dt)
    speech.update(dt / 1000)
    pres.update(dt)
  }
  world.render()
  // In Raum 3 bleibt die Blase unter der Galerie (die Rahmen leuchten bei den sieben Apps auf)
  bubble.place(world.headAnchor(), world.room?.id === 'r3' ? 156 : 76)
  input.endFrame()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

// --- Bedienung -------------------------------------------------------------------------------------------
let helpOpen = false
let inGame = false

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}

async function toMenu() {
  director.stop()
  director.pause(false)
  ui.hideEnding()
  pres.clear()
  ui.clearSubtitle()
  inGame = false
  input.enabled = false
  const { mode } = await ui.menu()
  startGame(mode, 'r1')
}

function startGame(mode, room = 'r1') {
  ui.hideEnding()
  inGame = true
  input.enabled = true
  director.setMode(mode)
  director.play(room)
}

const actions = {
  pause: () => inGame && director.pause(!director.paused),
  next: () => director.next(),
  auto: () => inGame && director.setMode(director.mode === 'auto' ? 'manual' : 'auto'),
  music: () => {
    audio.setMusic(!audio.musicOn)
    ui.setPressed('music', audio.musicOn)
    ui.toast(audio.musicOn ? 'Musik an' : 'Musik aus')
  },
  subs: () => ui.toggleSubs(),
  full: toggleFullscreen,
  help: () => {
    helpOpen = !helpOpen
    ui.help(helpOpen)
  },
}
for (const [k, fn] of Object.entries(actions)) ui.on(k, fn)

ui.on('pauseMenu', (v) => {
  if (v === 'resume') director.pause(false)
  if (v === 'restart') {
    director.pause(false)
    director.restartRoom()
  }
  if (v === 'auto') {
    director.pause(false)
    actions.auto()
  }
  if (v === 'menu') toMenu()
})
ui.on('endMenu', (v) => {
  if (v === 'again') startGame(director.mode, 'r1')
  if (v === 'menu') toMenu()
})

addEventListener('keydown', (e) => {
  if (!inGame || e.ctrlKey || e.metaKey || e.altKey) return
  const c = e.code
  if (helpOpen && (c === 'KeyH' || c === 'Escape')) {
    e.preventDefault()
    actions.help()
    return
  }
  if (c === 'KeyP' || (c === 'Escape' && !helpOpen)) {
    e.preventDefault()
    actions.pause()
    return
  }
  if (director.paused) return
  if (c === 'KeyN') {
    e.preventDefault()
    if (e.shiftKey) director.skipSequence()
    else actions.next()
  } else if (c === 'KeyM') actions.music()
  else if (c === 'KeyU') actions.subs()
  else if (c === 'KeyF') toggleFullscreen()
  else if (c === 'KeyH') actions.help()
  else if (c === 'KeyO') actions.auto()
  else if (c === 'KeyG') {
    world.player.head.googly = !world.player.head.googly
    ui.toast(world.player.head.googly ? 'Kulleraugen an' : 'Kulleraugen aus')
  } else if (c === 'KeyK') {
    // Körperstil durchschalten: Klassik → Strick → Hoodie
    const p = world.player
    p.style = BODY_STYLES[(BODY_STYLES.indexOf(p.style) + 1) % BODY_STYLES.length]
    try {
      localStorage.setItem('bf-body', p.style)
    } catch {}
    ui.toast(`Körper: ${BODY_LABELS[p.style]}`)
  } else if (c === 'KeyR') director.restartRoom()
  else if (['Digit1', 'Digit2', 'Digit3'].includes(c)) {
    ui.hideEnding()
    director.play(`r${c.slice(-1)}`)
  }
})

// HUD und Mauszeiger treten zurück, wenn die Maus ruht (aufgeräumte Bühne im Teams-Stream)
let idleTimer = 0
function wake() {
  $('hud').classList.remove('dim')
  stage.classList.remove('idle')
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (!$('hud').contains(document.activeElement)) $('hud').classList.add('dim')
    stage.classList.add('idle')
  }, 2500)
}
addEventListener('pointermove', wake)
addEventListener('pointerdown', wake)
wake()

// --- Start ---------------------------------------------------------------------------------------------------
async function boot() {
  input.enabled = false
  if (params.has('timing')) {
    openTimingTool()
    return
  }
  if (params.has('room')) {
    // Direkteinstieg für Tests: ?room=2&auto=1
    audio.unlock()
    startGame(params.get('auto') === '1' ? 'auto' : 'manual', `r${params.get('room')}`)
    return
  }
  await ui.boot()
  if (params.get('auto') === '1') startGame('auto', 'r1')
  else toMenu()
}
boot()
