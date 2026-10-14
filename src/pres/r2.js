// Raum 2 – Compiler-Labor: Kompilieren → Maschinencode → Dekompilieren → KI-Annotation,
// danach Mechanik-Transfer zwischen zwei Spielen und der Clean-Room-Ansatz.
import { icon } from '../ui/icons.js'
import { audio } from '../engine/audio.js'
import { animate, sleep } from '../engine/clock.js'
import { bodySprite } from '../game/body.js'
import { P } from '../game/palette.js'
import { q, qa, run, typeInto, highlightC } from './util.js'

const SOURCE = '// Zwei Zahlen addieren\nint addiere(int a, int b) {\n  return a + b;\n}'
const BITS = '10001001 11111000\n00000001 11110000\n11000011'
const HEX = 'x86-64: 89 F8 · 01 F0 · C3'
const RAW = 'int sub_401000(int a1, int a2) {\n  return a2 + a1;\n}'
const AI_CODE = '// KI: addiert zwei Zahlen\nint summe(int x, int y) {\n  return x + y;\n}'

function compilerScene() {
  return `
  <div class="scene compiler in">
    <div class="p">
      <header class="p-head">
        <div><p class="eyebrow">Raum 2 · Compiler-Labor</p><h2>Vom Code zur <em>Maschine</em></h2></div>
        <span class="chip status-chip">Compiler bereit</span>
      </header>
    </div>
    <span class="back-q">… und zurück?</span>
    <div class="pipe p1" style="left:680px"></div>
    <div class="pipe p2 back" style="left:1280px"></div>
    <div class="lanes">
      <section class="panel src">
        <h3>${icon('code', { size: 24 })}Quellcode <small>Sprache C</small></h3>
        <pre class="code"></pre>
        <footer>Von Menschen geschrieben – gut lesbar.</footer>
        <span class="chip stamp">bleibt beim Hersteller</span>
      </section>
      <div class="flow f1"><div class="track"><i></i><i></i><i></i></div><span class="lbl">KOMPILIEREN</span></div>
      <section class="panel bin">
        <h3>${icon('robot', { size: 22 })}Maschinencode <small>für den Prozessor</small></h3>
        <pre class="bits"></pre>
        <span class="hexline"></span>
        <footer>Binärdarstellung schematisch</footer>
        <span class="chip lime ship">${icon('box', { size: 22 })} ausgeliefert</span>
        <div class="qmarks"><span style="left:12%;top:30%">?</span><span style="left:60%;top:10%">?</span><span style="left:38%;top:52%">?</span><span style="left:78%;top:44%">?</span></div>
        <span class="lens">${icon('search', { size: 54 })}</span>
      </section>
      <div class="flow f2"><div class="track"><i></i><i></i><i></i></div><span class="lbl">DEKOMPILIEREN</span></div>
      <section class="panel rec back">
        <h3>${icon('code', { size: 24 })}Rekonstruierter Code <small>Decompiler</small></h3>
        <pre class="code"></pre>
        <footer>Lesbar – aber nicht der Original-Quellcode.</footer>
        <span class="chip rust stamp">nicht das Original</span>
        <div class="costs"><span class="chip rust">schwierig</span><span class="chip rust">zeitaufwendig</span><span class="chip rust">teuer</span></div>
        <span class="chip lime ai-note">${icon('spark', { size: 20 })} KI benennt und erklärt – als Vorschlag</span>
      </section>
    </div>
    <div class="foot-note"><b>HINWEIS</b> Vereinfacht. Kompilieren ist keine Verschlüsselung – aus Maschinencode lässt sich die Funktionsweise erschließen, nur mühsam.</div>
  </div>`
}

function mechanicsScene() {
  return `
  <div class="scene mechanics in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 2 · Für die Spielefusionen</p><h2>Verstanden → <em>übertragen</em></h2></div>
      <span class="chip ink mode-chip">Mechaniken einbauen</span>
    </header></div>
    <div class="games">
      <div class="gwin a"><div class="bar"><i></i>Spiel A · Jump'n'Run</div><canvas width="140" height="63"></canvas></div>
      <div class="gwin b"><div class="bar"><i class="r"></i>Spiel B · Fantasy-Welt</div><canvas width="140" height="63"></canvas></div>
      <span class="fnchip one">springen()</span>
      <span class="fnchip two">kämpfen()</span>
      <div class="bridge"><div class="cable"></div><span class="chip ink">Verbindungscode</span><span class="chip lime ai">${icon('spark', { size: 20 })} KI hilft beim Entwickeln</span></div>
    </div>
  </div>`
}

function cleanroomScene() {
  return `
  <div class="scene cleanroom in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 2 · Der andere Weg</p><h2>Clean Room: <em>Verhalten</em> statt Code</h2></div>
      <span class="chip green">Klassischer Ansatz</span>
    </header></div>
    <div class="cr">
      <div class="cr-box orig reveal"><div class="ic">${icon('question', { size: 30 })}</div><div><h4>Original&shy;programm</h4><p>Nur als fertige Software</p></div></div>
      <span class="cr-arrow reveal a1" style="left:330px">${icon('arrow', { size: 40 })}</span>
      <div class="cr-box card s1 reveal"><div class="ic">${icon('eye', { size: 38 })}</div><div><h4>Verhalten beobachten</h4><p>Was tut das Programm?</p></div></div>
      <span class="cr-arrow reveal a2" style="left:665px">${icon('arrow', { size: 40 })}</span>
      <div class="cr-box card s2 reveal"><div class="ic">${icon('doc', { size: 36 })}</div><div><h4>Funktionen beschreiben</h4><p>Eine Spezifikation entsteht</p></div></div>
      <div class="team a reveal"><span class="ppl">${icon('person', { size: 34 })}${icon('person', { size: 34 })}</span><span>Team A<small>analysiert und beschreibt</small></span></div>
      <div class="wall reveal"></div>
      <span class="chip rust wall-label reveal">Trennung</span>
      <span class="spec">${icon('doc', { size: 44 })}</span>
      <span class="chip blocked">${icon('cross', { size: 16 })} Originalcode</span>
      <div class="cr-box card s3 reveal"><div class="ic">${icon('code', { size: 38 })}</div><div><h4>Eigenen Code schreiben</h4><p>Nur aus der Beschreibung</p></div></div>
      <span class="cr-arrow reveal a3" style="left:1530px">${icon('arrow', { size: 40 })}</span>
      <div class="cr-box card res reveal"><div class="ic">${icon('check', { size: 30 })}</div><div><h4>Neues Programm</h4><p>Ähnliche Funktionen, eigener Code</p></div></div>
      <div class="team b reveal"><span class="ppl">${icon('personR', { size: 34 })}${icon('personR', { size: 34 })}</span><span>Team B<small>kennt den Originalcode nicht</small></span></div>
      <span class="chip lime ai-chip reveal">${icon('spark', { size: 20 })} KI hilft beim Neu-Programmieren</span>
    </div>
    <div class="foot-note reveal fn" style="right:640px"><b>EINORDNUNG</b> Clean Room ist eine organisatorische Trennung von Analyse und Umsetzung – keine dritte Compiler-Methode und keine Garantie für Rechtmäßigkeit.</div>
    <div class="teaser reveal">Nicht nur Spiele – nächste Tür ${icon('arrow', { size: 26 })}</div>
  </div>`
}

// --- Mini-Spiele in der Mechanik-Szene ----------------------------------------------------------------
function drawGameA(g, t, extra) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h) }
  R(0, 0, 140, 63, '#cfe7f0')
  R(0, 40, 140, 23, '#bfe0c8')
  for (let i = 0; i < 3; i++) { const cx = ((t / 120 + i * 50) % 170) - 20; R(Math.round(cx), 8 + i * 6, 12, 3, '#ffffff'); R(Math.round(cx) + 3, 6 + i * 6, 6, 2, '#ffffff') }
  R(0, 52, 140, 11, '#7cb35b'); R(0, 52, 140, 2, '#9bd06e')
  for (let x = 0; x < 140; x += 8) R(x, 56, 4, 3, '#5f9447')
  R(84, 32, 18, 5, '#b9643f'); R(84, 32, 18, 1, '#d27a55')
  R(90, 26, 5, 5, '#e9b949')
  // Held: läuft hin und her und springt
  const period = 3.2
  const ph = (t / 1000) % period
  const x = 18 + Math.abs(((t / 1000) * 22) % 90 - 45)
  const jump = ph < 0.55 ? Math.sin((ph / 0.55) * Math.PI) * 14 : 0
  const spr = bodySprite(jump > 0 ? 'jump' : 'walk', Math.floor(t / 120) % 4)
  g.drawImage(spr.canvas, Math.round(x) - 12, Math.round(52 - 26 - jump))
  R(Math.round(x) - 3, Math.round(52 - 33 - jump), 7, 7, P.skin)
  R(Math.round(x) - 3, Math.round(52 - 34 - jump), 7, 3, '#7a5233')
  if (extra.knightGhost) drawKnight(g, 112, 52, t, 0.5, false)
}

function drawKnight(g, x, ground, t, alpha = 1, swing = false, jump = 0) {
  g.save()
  g.globalAlpha = alpha
  const R = (xx, yy, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(xx), Math.round(yy), w, h) }
  const y = ground - jump
  const step = Math.floor(t / 140) % 2
  R(x - 4, y - 6, 3, 6 - step, '#3b3f4a'); R(x + 1, y - 6, 3, 5 + step, '#3b3f4a')
  R(x - 5, y - 16, 10, 10, '#aeb6c2'); R(x - 5, y - 16, 10, 2, '#d6dce4'); R(x - 1, y - 14, 2, 6, '#c2463a')
  R(x - 4, y - 23, 8, 7, '#9aa3b0'); R(x - 2, y - 20, 6, 2, '#20232a'); R(x - 1, y - 26, 2, 3, '#c2463a')
  if (swing) {
    const a = Math.sin(t / 110)
    R(x + 5, y - 18 + a * 4, 2, 12, '#e8ecf2'); R(x + 3, y - 8 + a * 4, 6, 2, '#6b4a2b')
  } else R(x + 5, y - 14, 2, 10, '#e8ecf2')
  g.restore()
}

function drawGameB(g, t, st) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h) }
  R(0, 0, 140, 63, '#2b2e45')
  R(0, 30, 140, 33, '#3a3d5c')
  for (let i = 0; i < 14; i++) R((i * 37) % 140, (i * 13) % 26, 1, 1, '#f2efd8')
  R(96, 16, 26, 26, '#262840'); R(96, 12, 5, 4, '#262840'); R(106, 12, 5, 4, '#262840'); R(117, 12, 5, 4, '#262840'); R(106, 30, 6, 12, '#e9b949')
  R(0, 52, 140, 11, '#4b4a3f'); R(0, 52, 140, 2, '#6b6a58')
  for (let x = 0; x < 140; x += 10) R(x, 56, 6, 3, '#3a392f')
  const x = 20 + Math.abs(((t / 1000) * 16) % 70 - 35)
  let jump = 0
  if (st.canJump) {
    const ph = (t / 1000) % 2.6
    jump = ph < 0.55 ? Math.sin((ph / 0.55) * Math.PI) * 13 : 0
  }
  drawKnight(g, x, 52, t, 1, st.canFight, jump)
  if (st.heroGhost) {
    g.globalAlpha = 0.55
    const spr = bodySprite('walk', Math.floor(t / 120) % 4)
    g.drawImage(spr.canvas, 100, 26)
    R(109, 19, 7, 7, P.skin)
    g.globalAlpha = 1
  }
}

export function mountR2(root, { signal, onFrame }) {
  root.innerHTML = compilerScene()
  let scene = root.firstElementChild
  const $ = (s) => q(scene, s)
  const st = { canJump: false, canFight: false, heroGhost: false, knightGhost: false }

  async function swap(html) {
    const old = scene
    old.classList.remove('in')
    old.classList.add('out')
    audio.sfx('whoosh')
    await sleep(420, signal)
    old.remove()
    root.insertAdjacentHTML('beforeend', html)
    scene = root.lastElementChild
  }

  function setPanel(sel, cls = 'active') {
    qa(scene, '.panel').forEach((p) => p.classList.remove('active'))
    if (sel) $(sel).classList.add(cls)
  }

  const api = {
    lookLeft() {
      setPanel('.src')
      $('.src .code').innerHTML = '<span class="cur"></span>'
    },
    compilerOn() {
      $('.p1').classList.add('running')
      const c = $('.status-chip')
      c.textContent = 'Compiler läuft'
      c.classList.add('green', 'live')
    },
    typeSource() {
      setPanel('.src')
      run(typeInto($('.src .code'), SOURCE, { cps: 26, render: highlightC, signal }))
    },
    compile() {
      $('.f1').classList.add('on')
      setPanel('.bin')
      audio.sfx('bits')
      const el = $('.bits')
      const final = BITS
      run(animate(2600, (p) => {
        const n = Math.floor(p * final.length)
        let s = final.slice(0, n)
        // die nächsten Stellen flackern noch
        for (let i = n; i < Math.min(final.length, n + 4); i++) s += final[i] === '\n' || final[i] === ' ' ? final[i] : Math.random() < 0.5 ? '0' : '1'
        el.textContent = s
        if (p >= 1) {
          $('.hexline').textContent = HEX
          audio.sfx('bits', { rate: 1.2, vol: 0.6 })
        }
      }, signal))
    },
    ship() {
      $('.f1').classList.remove('on')
      $('.p1').classList.remove('running')
      $('.ship').classList.add('on')
      $('.src').classList.add('dim')
      $('.src .stamp').classList.add('on')
      const c = $('.status-chip')
      c.textContent = 'Programm ausgeliefert'
      c.classList.remove('live')
      audio.sfx('pop')
    },
    puzzle() {
      $('.qmarks').classList.add('on')
      $('.lens').classList.add('on')
    },
    hintDecompile() {
      $('.f2').classList.add('pulse')
      $('.back-q').classList.add('on')
      $('.status-chip').textContent = 'Decompiler bereit'
    },
    decompile() {
      $('.p2').classList.add('running')
      $('.f2').classList.add('on')
      $('.qmarks').classList.remove('on')
      $('.lens').classList.remove('on')
      setPanel('.rec')
      const c = $('.status-chip')
      c.textContent = 'Decompiler läuft'
      c.className = 'chip rust status-chip live'
      audio.sfx('bits', { rate: 0.85 })
    },
    typeReconstructed() {
      run(typeInto($('.rec .code'), RAW, { cps: 24, render: highlightC, signal }))
    },
    notOriginal() {
      $('.rec .stamp').classList.add('on')
      $('.f2').classList.remove('on')
      $('.p2').classList.remove('running')
      $('.status-chip').classList.remove('live')
      audio.sfx('pop', { rate: 0.9 })
    },
    cost(i) {
      qa(scene, '.costs .chip')[i]?.classList.add('on')
      audio.sfx('ui-move', { rate: 0.9 + i * 0.1 })
    },
    aiAnnotate() {
      qa(scene, '.costs .chip').forEach((c) => c.classList.remove('on'))
      const el = $('.rec .code')
      audio.sfx('sparkle')
      const c = $('.status-chip')
      c.innerHTML = `${icon('spark', { size: 18 })} KI hilft beim Verstehen`
      c.className = 'chip lime status-chip'
      const render = (s) =>
        highlightC(s)
          .replace(/(<span class="cm">[^<]*<\/span>)/, '<span class="ai">$1</span>')
          .replace(/<span class="fn">summe<\/span>/, '<span class="ai"><span class="fn">summe</span></span>')
      run(typeInto(el, AI_CODE, { cps: 34, render, signal }).then(() => $('.ai-note').classList.add('on')))
    },
    async mechanics() {
      await swap(mechanicsScene())
      const [ca, cb] = qa(scene, 'canvas')
      const ga = ca.getContext('2d')
      const gb = cb.getContext('2d')
      ga.imageSmoothingEnabled = gb.imageSmoothingEnabled = false
      let t = 0
      onFrame((dt) => {
        t += dt
        drawGameA(ga, t, st)
        drawGameB(gb, t, st)
      })
    },
    transfer(i) {
      const chip = qa(scene, '.fnchip')[i]
      if (!chip) return
      chip.style.left = '380px'
      chip.classList.add('on')
      audio.sfx('ui-select')
      run(sleep(500, signal).then(() => {
        chip.style.left = '1400px'
        audio.sfx('whoosh')
        return sleep(1400, signal)
      }).then(() => {
        if (i === 0) st.canJump = true
        else st.canFight = true
        audio.sfx('sparkle', { vol: 0.6 })
      }))
    },
    bridge() {
      qa(scene, '.fnchip').forEach((c) => (c.style.opacity = 0))
      $('.bridge').classList.add('on')
      $('.mode-chip').textContent = 'Zwei laufende Spiele verbinden'
      st.heroGhost = true
      st.knightGhost = true
      audio.sfx('bits')
    },
    async cleanRoom(step) {
      if (step === 1) {
        await swap(cleanroomScene())
        for (const s of ['.orig', '.a1', '.s1']) $(s).classList.add('on')
        audio.sfx('pop')
      }
      if (step === 1.5) {
        $('.a2').classList.add('on')
        $('.s2').classList.add('on')
        audio.sfx('pop')
      }
      if (step === 2) {
        $('.team.a').classList.add('on')
        $('.spec').classList.add('on')
        audio.sfx('ui-select')
      }
      if (step === 3) {
        $('.wall').classList.add('on')
        $('.wall-label').classList.add('on')
        $('.blocked').classList.add('on')
        run(sleep(700, signal).then(() => {
          $('.spec').classList.add('through')
          audio.sfx('whoosh')
          return sleep(1100, signal)
        }).then(() => {
          for (const s of ['.s3', '.team.b', '.a3', '.res']) $(s).classList.add('on')
          audio.sfx('pop')
        }))
      }
      if (step === 4) {
        $('.ai-chip').classList.add('on')
        audio.sfx('sparkle')
      }
      if (step === 5) {
        $('.fn').classList.add('on')
        $('.teaser').classList.add('on')
      }
    },
  }
  return api
}
