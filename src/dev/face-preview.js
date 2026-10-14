// Kleine Testbühne für Figur und Kopf-Rig (nur Entwicklung): /face.html
import { Head } from '../game/head.js'
import { bodySprite, CX, FEET } from '../game/body.js'
import { Babble } from '../engine/babble.js'
import { P } from '../game/palette.js'
import content from '../data/content.json'

const canvas = document.getElementById('c')
const g = canvas.getContext('2d')
const low = document.createElement('canvas')
const LW = 160
const LH = 64
low.width = LW
low.height = LH
const lg = low.getContext('2d')
const FLOOR = 54
const HEAD_H = 34

const head = new Head('/')
const babble = new Babble()
const bubble = document.getElementById('bubble')
const player = { x: 70, y: FLOOR, vx: 0, vy: 0, ground: true, facing: 1, walk: 0 }
const keys = new Set()
let talkMode = false
let sayUntil = 0
let manual = 0
let t = 0
const sentences = content.sequences[0].sentences
let sentence = 0

function resize() {
  const r = canvas.getBoundingClientRect()
  canvas.width = Math.round(r.width * devicePixelRatio)
  canvas.height = Math.round(r.height * devicePixelRatio)
}
addEventListener('resize', resize)
resize()

function say() {
  const s = sentences[sentence++ % sentences.length]
  bubble.textContent = s
  bubble.hidden = false
  sayUntil = t + Math.max(2.5, s.length / 15)
}
const jump = () => {
  if (player.ground) {
    player.vy = -150
    player.ground = false
  }
}
const toggleEyes = () => (head.googly = !head.googly)
const toggleTalk = () => (talkMode = !talkMode)

document.getElementById('say').onclick = say
document.getElementById('talk').onclick = toggleTalk
document.getElementById('jump').onclick = jump
document.getElementById('eyes').onclick = toggleEyes
document.getElementById('mouth').oninput = (e) => (manual = e.target.value / 100)
const BROWS = ['flash', 'raise', 'wiggle', 'skeptic', 'happy']
document.querySelectorAll('[data-brow]').forEach((b) => (b.onclick = () => head.brow(b.dataset.brow)))
addEventListener('keydown', (e) => {
  const i = Number(e.key) - 1
  if (i >= 0 && i < BROWS.length) head.brow(BROWS[i])
})

addEventListener('keydown', (e) => {
  if (e.repeat) return
  if (e.code === 'Space') { e.preventDefault(); jump() }
  if (e.code === 'KeyE') say()
  if (e.code === 'KeyR') toggleTalk()
  if (e.code === 'KeyG') toggleEyes()
  keys.add(e.code)
})
addEventListener('keyup', (e) => keys.delete(e.code))

function drawRoom() {
  lg.fillStyle = P.wall
  lg.fillRect(0, 0, LW, LH)
  lg.fillStyle = P.wall2
  for (let x = 0; x < LW; x += 8) lg.fillRect(x, 0, 1, FLOOR - 14)
  lg.fillStyle = P.wallD
  lg.fillRect(0, FLOOR - 14, LW, 14)
  lg.fillStyle = P.wallDD
  lg.fillRect(0, FLOOR - 14, LW, 1)
  lg.fillStyle = P.ink
  lg.fillRect(0, FLOOR, LW, 2)
  for (let y = FLOOR + 2; y < LH; y += 3) {
    lg.fillStyle = (y / 3) % 2 ? P.wood : P.wood2
    lg.fillRect(0, y, LW, 3)
    lg.fillStyle = P.woodD
    for (let x = ((y * 7) % 23); x < LW; x += 23) lg.fillRect(x, y, 1, 3)
  }
}

let last = performance.now()
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  t += dt

  const dir = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
  player.vx += (dir * 60 - player.vx) * Math.min(1, dt * 10)
  if (dir) player.facing = dir
  player.vy += 420 * dt
  player.x = Math.max(12, Math.min(LW - 12, player.x + player.vx * dt))
  player.y += player.vy * dt
  if (player.y >= FLOOR) {
    if (!player.ground) head.kick(0, 260)
    player.y = FLOOR
    player.vy = 0
    player.ground = true
  }
  if (Math.abs(player.vx) > 5 && player.ground) player.walk += dt * 9
  else player.walk = 0

  const speaking = talkMode || t < sayUntil
  if (!speaking) bubble.hidden = true
  const lvl = manual > 0 ? manual : babble.update(dt, speaking)
  head.setTalk(lvl)
  head.setLook(speaking ? 0.1 : 0.35 * Math.sin(t * 0.7), speaking ? 0.15 : 0.25)
  head.update(dt, { x: player.vx * 4, y: player.vy * 4 }, player.facing)

  // Pose wählen
  let pose = 'idle'
  let f = Math.floor(t * 1.6) % 2
  if (!player.ground) pose = player.vy < 0 ? 'jump' : 'fall'
  else if (Math.abs(player.vx) > 5) { pose = 'walk'; f = Math.floor(player.walk) % 4 }
  else if (speaking) { pose = 'talk'; f = Math.floor(t * 1.3) % 2 }
  const spr = bodySprite(pose, f)

  drawRoom()
  const bx = Math.round(player.x) - CX
  const by = Math.round(player.y) - FEET
  lg.save()
  if (player.facing < 0) {
    lg.translate(bx * 2 + spr.canvas.width, 0)
    lg.scale(-1, 1)
  }
  lg.drawImage(spr.canvas, bx, by)
  lg.restore()

  // Bildschirmmaßstab: Welt füllt die Höhe
  const S = canvas.height / LH
  const ox = (canvas.width - LW * S) / 2
  g.fillStyle = P.paper
  g.fillRect(0, 0, canvas.width, canvas.height)
  g.imageSmoothingEnabled = false
  g.drawImage(low, ox, 0, LW * S, LH * S)
  const neckX = player.facing > 0 ? bx + spr.neckX : bx + (spr.canvas.width - spr.neckX)
  const chinX = ox + (neckX) * S
  const chinY = (by + spr.neckY + 1.5) * S
  head.draw(g, chinX, chinY, HEAD_H * S, player.facing)

  if (!bubble.hidden) {
    const dpr = devicePixelRatio
    bubble.style.left = `${Math.min(innerWidth - 480, chinX / dpr + 40)}px`
    bubble.style.top = `${Math.max(8, (chinY - HEAD_H * S * 1.15) / dpr)}px`
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
