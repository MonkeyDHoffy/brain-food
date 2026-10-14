// Oberfläche rund ums Spiel: Bootscreen, Menü, HUD, Untertitel, Pause, Hilfe, Abspann, Hinweise.
import { icon } from './icons.js'
import { audio } from '../engine/audio.js'
import { SOURCES } from '../data/media.js'
import { ALL_SENTENCES } from '../engine/speech.js'
import { Head } from '../game/head.js'
import { Babble } from '../engine/babble.js'

const $ = (id) => document.getElementById(id)
const BASE = import.meta.env.BASE_URL

const BOOT_LINES = [
  ['BRAIN FOOD OS v1.0', ''],
  ['Speichertest', '640K OK'],
  ['Lade Reverse-Engineering-Modul', 'OK'],
  ['Lade Compiler und Decompiler', 'OK'],
  ['Kalibriere Kulleraugen', 'OK'],
  ['KI-Assistent', 'BEREIT'],
]

export class UI {
  constructor() {
    this.stage = $('stage')
    this.subOn = true
    this.handlers = {}
    this.toastTimer = 0
    this.buildHud()
  }

  on(name, fn) {
    this.handlers[name] = fn
  }

  /** Solange ein Overlay offen ist, ist der Rest der Bühne nicht fokussierbar (Tab bleibt im Overlay). */
  syncInert() {
    const open = ['boot', 'menu', 'pause', 'help', 'ending'].some((id) => !$(id).hidden)
    for (const id of ['field', 'pres', 'subtitleBar']) $(id).inert = open
  }

  fire(name, ...a) {
    this.handlers[name]?.(...a)
  }

  // --- HUD --------------------------------------------------------------------------------------------
  buildHud() {
    const btn = (id, ic, tip, toggle = false) =>
      `<button type="button" data-act="${id}" ${toggle ? 'class="toggle" aria-pressed="true"' : ''} aria-label="${tip}">${icon(ic, { size: 28 })}<span class="tip">${tip}</span></button>`
    $('hud').innerHTML = [
      btn('pause', 'pause', 'Pause (P)'),
      btn('next', 'skip', 'Weiter (N)'),
      btn('auto', 'robot', 'Autopilot (O)', true),
      btn('music', 'music', 'Musik (M)', true),
      btn('subs', 'cc', 'Untertitel (U)', true),
      btn('full', 'full', 'Vollbild (F)'),
      btn('help', 'help', 'Hilfe (H)'),
    ].join('')
    $('hud').addEventListener('click', (e) => {
      const b = e.target.closest('button')
      if (!b) return
      b.blur()
      this.fire(b.dataset.act)
    })
    $('subtitleKeys').innerHTML = '<kbd>N</kbd> weiter · <kbd>P</kbd> Pause · <kbd>H</kbd> Hilfe'
  }

  setPressed(act, on) {
    const b = $('hud').querySelector(`[data-act="${act}"]`)
    if (b) b.setAttribute('aria-pressed', String(on))
  }

  mode(m) {
    const tag = $('modeTag')
    tag.textContent = m === 'auto' ? 'AUTOPILOT' : 'MANUELL'
    tag.classList.toggle('auto', m === 'auto')
    this.setPressed('auto', m === 'auto')
  }

  room(def) {
    this.stage.dataset.room = def.id
    $('roomTag').textContent = `RAUM ${def.index}/3`
    $('roomName').textContent = def.name
    $('fieldHead').removeAttribute('data-hidden')
  }

  plateDone(id) {
    document.querySelector(`.plate[data-id="${id}"]`)?.classList.add('done')
  }

  subtitle(text, seqId, i, seq) {
    $('subtitleText').textContent = text
    const titles = { '01-intro': 'Einstieg', '02-compile': 'Kompilieren', '03-decompile-cleanroom': 'Dekompilieren & Clean Room', '04-artcraft-outlook': 'ArtCraft & Ausblick', 'gag-jannik': 'Kurzer Exkurs' }
    $('subtitleMeta').innerHTML = `${titles[seqId] || ''}<small>Satz ${i + 1} von ${seq.sentences.length}</small>`
    const k = ALL_SENTENCES.indexOf(`${seqId}:${i}`)
    $('progress').style.width = `${((k + 1) / ALL_SENTENCES.length) * 100}%`
  }

  clearSubtitle() {
    $('subtitleText').textContent = ''
    $('subtitleMeta').innerHTML = ''
  }

  toggleSubs() {
    this.subOn = !this.subOn
    $('subtitleBar').classList.toggle('off', !this.subOn)
    this.setPressed('subs', this.subOn)
    this.toast(this.subOn ? 'Untertitel an' : 'Untertitel aus')
  }

  toast(text) {
    const t = $('toast')
    t.textContent = text
    t.classList.add('show')
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 1600)
  }

  // --- Bootscreen ---------------------------------------------------------------------------------------
  boot() {
    return new Promise((resolve) => {
      const el = $('boot')
      el.hidden = false
      this.syncInert()
      el.innerHTML = `
        <div class="crt">
          <div class="logo">${icon('brain', { size: 110 })}<h1>BRAIN<span>FOOD</span></h1><p>Level 1 · Reverse Engineering mit KI</p></div>
          <button type="button" class="power">${icon('play', { size: 22 })} EINSCHALTEN</button>
          <p class="press">Klicken oder beliebige Taste drücken</p>
          <pre class="log" hidden></pre>
        </div>`
      const power = el.querySelector('.power')
      power.focus()
      let started = false
      const start = async (e) => {
        if (started) return
        if (e?.type === 'keydown' && ['Tab', 'Shift', 'Alt', 'Control', 'Meta'].includes(e.key)) return
        started = true
        removeEventListener('keydown', start)
        audio.unlock()
        audio.sfx('boot')
        el.querySelector('.power').hidden = true
        el.querySelector('.press').hidden = true
        const log = el.querySelector('.log')
        log.hidden = false
        for (const [a, b] of BOOT_LINES) {
          log.textContent += b ? `${a.padEnd(34, '.')} ${b}\n` : `${a}\n\n`
          await new Promise((r) => setTimeout(r, 230))
        }
        await new Promise((r) => setTimeout(r, 450))
        el.classList.add('off')
        await new Promise((r) => setTimeout(r, 380))
        el.hidden = true
        this.syncInert()
        el.classList.remove('off')
        audio.startMusic()
        resolve()
      }
      power.addEventListener('click', start)
      addEventListener('keydown', start)
    })
  }

  // --- Menü -----------------------------------------------------------------------------------------------
  /** Liefert {mode} nach Auswahl. */
  menu() {
    return new Promise((resolve) => {
      const el = $('menu')
      el.hidden = false
      this.syncInert()
      const render = (step) => {
        el.innerHTML = `
          <div class="menu-wrap">
            <div class="menu-brand">${icon('brain', { size: 54 })}<span>BRAIN FOOD</span></div>
            <div class="box menu-box">
              <p class="eyebrow">${step === 0 ? 'Level wählen' : 'Level 1 · Modus wählen'}</p>
              <div class="menu-list">
                ${step === 0
                  ? `<button type="button" class="menu-item sel" data-v="level">Level 1: Reverse Engineering mit KI <small>3 Räume · ca. 5 Min.</small></button>`
                  : `<button type="button" class="menu-item sel" data-v="manual">Manuell spielen <small>A/D · Leertaste · E</small></button>
                     <button type="button" class="menu-item" data-v="auto">Autopilot starten <small>läuft von allein</small></button>
                     <button type="button" class="menu-item" data-v="back">Zurück</button>`}
              </div>
              <p class="menu-foot">Pause jederzeit mit <kbd>P</kbd> · Hilfe mit <kbd>H</kbd> · Ton erst nach dem Start</p>
            </div>
          </div>`
        const items = [...el.querySelectorAll('.menu-item')]
        items[0].focus()
        items.forEach((b) => {
          b.addEventListener('pointermove', (e) => (e.movementX || e.movementY) && document.activeElement !== b && b.focus())
          b.addEventListener('focus', () => {
            items.forEach((x) => x.classList.toggle('sel', x === b))
          })
          b.addEventListener('click', () => choose(b.dataset.v))
        })
      }
      let step = 0
      const choose = (v) => {
        audio.sfx('ui-select')
        if (v === 'level') {
          step = 1
          render(1)
        } else if (v === 'back') {
          step = 0
          render(0)
        } else {
          removeEventListener('keydown', keys, true)
          el.hidden = true
          this.syncInert()
          resolve({ mode: v })
        }
      }
      const keys = (e) => {
        if (['ArrowDown', 'KeyS', 'ArrowUp', 'KeyW', 'Enter', 'Space', 'KeyE', 'Escape'].includes(e.code)) e.stopPropagation()
        const items = [...el.querySelectorAll('.menu-item')]
        const i = items.indexOf(document.activeElement)
        if (['ArrowDown', 'KeyS'].includes(e.code)) {
          e.preventDefault()
          items[(i + 1) % items.length].focus()
          audio.sfx('ui-move')
        } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
          e.preventDefault()
          items[(i - 1 + items.length) % items.length].focus()
          audio.sfx('ui-move')
        } else if (['Enter', 'Space', 'KeyE'].includes(e.code)) {
          e.preventDefault()
          choose((items[i] || items[0]).dataset.v)
        } else if (e.code === 'Escape' && step === 1) {
          e.preventDefault()
          choose('back')
        }
      }
      addEventListener('keydown', keys, true)
      render(0)
    })
  }

  // --- Pause & Hilfe --------------------------------------------------------------------------------------
  paused(on) {
    this.stage.classList.toggle('paused', on)
    this.setPressed('pause', on)
    const el = $('pause')
    el.hidden = !on
    this.syncInert()
    if (!on) return
    el.innerHTML = `
      <div class="box">
        <h2>PAUSE</h2>
        <p>Alles steht – Ton, Text und Animationen.</p>
        <div class="menu-list">
          <button type="button" class="menu-item sel" data-v="resume">Weiter <small>P / Esc</small></button>
          <button type="button" class="menu-item" data-v="restart">Raum neu starten <small>R</small></button>
          <button type="button" class="menu-item" data-v="auto">Autopilot an/aus <small>O</small></button>
          <button type="button" class="menu-item" data-v="menu">Zum Hauptmenü</button>
        </div>
      </div>`
    const items = [...el.querySelectorAll('.menu-item')]
    items[0].focus()
    items.forEach((b) => {
      b.addEventListener('focus', () => items.forEach((x) => x.classList.toggle('sel', x === b)))
      b.addEventListener('pointermove', (e) => (e.movementX || e.movementY) && document.activeElement !== b && b.focus())
      b.addEventListener('click', () => this.fire('pauseMenu', b.dataset.v))
    })
  }

  help(show) {
    const el = $('help')
    el.hidden = !show
    this.syncInert()
    if (!show) return
    const k = (key, text) => `<span><kbd>${key}</kbd></span><span>${text}</span>`
    el.innerHTML = `
      <div class="box">
        <h2>STEUERUNG</h2>
        <div class="grid">
          ${k('A D', 'Laufen (auch ← →)')}${k('␣', 'Springen (auch W / ↑)')}
          ${k('E', 'Mikrofon, Tür')}${k('N', 'Nächster Satz / Aktion')}
          ${k('P', 'Pause')}${k('O', 'Autopilot an/aus')}
          ${k('M', 'Musik an/aus')}${k('U', 'Untertitel an/aus')}
          ${k('G', 'Kulleraugen an/aus')}${k('F', 'Vollbild')}
          ${k('R', 'Raum neu starten')}${k('1–3', 'Raum direkt starten')}
        </div>
        <p class="help-foot">Mikrofon, Knöpfe und Tür lassen sich auch anklicken – die Figur läuft dann selbst hin. <kbd>H</kbd> schließt.</p>
      </div>`
  }

  // --- Abspann ----------------------------------------------------------------------------------------------
  ending({ seconds }) {
    const el = $('ending')
    el.hidden = false
    this.syncInert()
    audio.sfx('complete')
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(Math.floor(seconds % 60)).padStart(2, '0')
    const stats = [
      ['Spielzeit', `${mm}:${ss}`],
      ['Räume', '3 / 3'],
      ['Funktionen dekompiliert', '1'],
      ['Neue Namen dank KI', 'summe()'],
      ['Clean Rooms betreten', '1'],
      ['Adobe-Nachbauten gezählt', '7'],
    ]
    el.innerHTML = `
      <div class="end-wrap">
        <div class="end-left">
          <p class="eyebrow">Brain Food · Level 1</p>
          <h1 class="lc">LEVEL<br>COMPLETE</h1>
          <div class="stars">${'<i></i>'.repeat(3)}</div>
          <dl class="stats">${stats.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
          <div class="end-actions">
            <button type="button" class="menu-item sel" data-v="again">Nochmal ansehen</button>
            <button type="button" class="menu-item" data-v="menu">Zum Menü</button>
          </div>
        </div>
        <div class="end-right">
          <div class="thanks">
            <canvas class="talker" width="380" height="480" aria-hidden="true"></canvas>
            <div class="say card">Danke! <span>Fragen?</span></div>
          </div>
          <div class="credits">
            <div class="roll">
              <h3>Quellen</h3>
              ${SOURCES.map(([a, b]) => `<p><b>${a}</b>${b}</p>`).join('')}
              <h3>Gebaut mit</h3>
              <p><b>Code</b>Vite + JavaScript, gebaut mit Claude Code</p>
              <p><b>Hinweis</b>Alle Marken gehören ihren Inhabern. Bilder dienen der Veranschaulichung.</p>
            </div>
          </div>
        </div>
      </div>`
    this.endHead(el)
    const items = [...el.querySelectorAll('.menu-item')]
    items[0].focus()
    items.forEach((b) => {
      b.addEventListener('focus', () => items.forEach((x) => x.classList.toggle('sel', x === b)))
      b.addEventListener('pointermove', (e) => (e.movementX || e.movementY) && document.activeElement !== b && b.focus())
      b.addEventListener('click', () => this.fire('endMenu', b.dataset.v))
    })
  }

  // Der Fotokopf sagt im Abspann immer wieder "Danke!" – mit Kulleraugen und Brauen
  endHead(el) {
    const cv = el.querySelector('.talker')
    const g = cv.getContext('2d')
    const head = new Head(BASE)
    const babble = new Babble()
    let last = performance.now()
    let t = 0
    head.brow('happy')
    const loop = (now) => {
      if (el.hidden || !cv.isConnected) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      head.setTalk(babble.update(dt, t % 3.4 < 1.5))
      head.setLook(Math.sin(t * 0.7) * 0.5, 0.15)
      head.update(dt)
      g.clearRect(0, 0, cv.width, cv.height)
      head.draw(g, cv.width / 2, cv.height - 8, cv.height * 0.92, 1)
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  hideEnding() {
    $('ending').hidden = true
    this.syncInert()
  }
}
