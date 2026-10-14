// Raum 3 – ArtCraft, Kritik und Ausblick (Sprechtext v2): Übersicht der sieben Nachbauten, PhotoCraft und Abo-Vergleich,
// Hersteller-Sicht („Jahrzehnte gegen Wochen“), die heikle Clean-Room-Frage, Recht und Debatte, Blick auf uns, Schlussfrage.
import { ARTCRAFT, ARTCRAFT_APPS } from '../data/media.js'
import { icon } from '../ui/icons.js'
import { audio } from '../engine/audio.js'
import { animate, sleep, ease } from '../engine/clock.js'
import { q, qa, run, imgTag, hydrateImages, MEDIA, typeInto, NULL_EL } from './util.js'

function waitScene() {
  return `
  <div class="scene wait in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Software-Atelier</p><h2>Die Software, mit der wir <em>arbeiten</em></h2></div>
      <span class="chip">Button ArtCraft ↑</span>
    </header></div>
  </div>`
}

function artcraftScene() {
  return `
  <div class="scene artcraft in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Fallbeispiel</p><h2>ArtCraft: Software <em>neu gebaut</em></h2></div>
      <div class="head-chips"><span class="chip ink">${icon('spark', { size: 18 })} mit KI-Unterstützung</span><span class="chip rust weeks reveal">in wenigen Wochen</span></div>
    </header></div>
    <div class="apps-wrap">
      <div class="app-count"><b>0</b><span>Adobe-Programme nachgebaut –<br>die „Craft Apps“</span></div>
      <div class="apps">
        ${ARTCRAFT_APPS.map((a) => `
          <div class="app"><img src="${MEDIA}${a.icon}" alt="" onerror="this.style.visibility='hidden'">
            <div><strong>${a.name.replace('Craft', `<span class="acc" style="color:${a.color}">Craft</span>`)}</strong><small>inspiriert von Adobe ${a.like}</small></div></div>`).join('')}
      </div>
      <p class="ai-fact reveal">Repos ab 30.09.2026 · Bericht HotHardware 08.10.2026 · getartcraft.com</p>
    </div>
    <div class="shot">
      <div class="bar"><i></i><i></i><i></i>&nbsp;PhotoCraft · Early Alpha</div>
      <div class="frame">${imgTag(ARTCRAFT.photocraft, 'PhotoCraft-Oberfläche')}</div>
      <p class="credit">${ARTCRAFT.photocraftCredit}</p>
      <span class="chip rust ribbon">noch kein Vollersatz</span>
    </div>
    <div class="claims">
      <div class="claim card price c0"><span class="chip lime">kostenlos &amp; quelloffen</span>
        <p>Adobe verkauft seine Programme im <b>Monatsabo</b>.</p></div>
      <div class="claim card c1"><span class="chip green">Laut Entwicklern</span>
        <p>Clean Room: öffentliche Beschreibungen und beobachtetes Verhalten statt Originalcode.</p></div>
      <div class="claim card warn c2"><span class="chip rust">Laut Projekt</span>
        <p>Noch kein vollwertiger Ersatz für professionelle Photoshop-Arbeit.</p></div>
    </div>
  </div>`
}

// Zeitstrahl 1990–2026: Photoshop-Balken gegen den winzigen PhotoCraft-Balken
const Y0 = 1990
const Y1 = 2026.8
const xOf = (y) => ((y - Y0) / (Y1 - Y0)) * 100

function decadesScene() {
  const ticks = [1990, 2000, 2010, 2020, 2026]
  return `
  <div class="scene decades in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Hersteller-Sicht</p><h2>Jahrzehnte gegen <em>Wochen</em></h2></div>
      <span class="chip rust">dürfte nicht schmecken</span>
    </header></div>
    <div class="bars">
      <div class="brow"><div class="blabel"><b>Photoshop</b><small>entwickelt seit 1990 · heute im Monatsabo</small></div>
        <div class="btrack"><i class="bfill ps" style="width:0"></i></div></div>
      <div class="brow"><div class="blabel"><b>PhotoCraft</b><small>Repo seit 30.09.2026 · kostenlos</small></div>
        <div class="btrack"><i class="bfill pc" style="right:0"></i><span class="bnote reveal">ein paar Wochen</span></div></div>
      <div class="baxis">${ticks.map((t) => `<span style="left:${xOf(t)}%">${t}</span>`).join('')}</div>
    </div>
    <div class="foot-note"><b>QUELLEN</b> Photoshop 1.0 erschien 1990 · PhotoCraft-Repository angelegt am 30.09.2026 (GitHub) · HotHardware, 08.10.2026</div>
  </div>`
}

function heikelScene() {
  return `
  <div class="scene heikel in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Die heikle Frage</p><h2>Noch ein sauberer <em>Clean Room?</em></h2></div>
      <span class="chip">${icon('search', { size: 20 })} aus der Projektdoku</span>
    </header></div>
    <div class="duo">
      <div class="card g reveal h1"><span class="chip green tag">Behauptet – laut Entwicklern</span><h3>Nur von außen</h3><p>Öffentliche Beschreibungen und beobachtetes Verhalten statt Adobes Originalcode.</p></div>
      <div class="sym reveal h2">?</div>
      <div class="card r reveal h3"><span class="chip rust tag">Laut eigener Parity-Doku untersucht</span><h3>Eine installierte Photoshop-Version</h3>
        <ul class="hlist"><li>Tastenkürzel-Datei</li><li>Presets</li><li>Texte im Programmcode</li></ul><p class="hsub">ohne das Programm zu starten</p></div>
    </div>
    <div class="foot-note reveal h4"><b>QUELLE</b> PhotoCraft, docs/target-app-parity.md („Target measured“) · Keine Bewertung – eine offene Frage.</div>
  </div>`
}

function lawScene() {
  return `
  <div class="scene law in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Rechtliche Einordnung</p><h2>Nachbauen ≠ <em>kopieren</em></h2></div>
      <span class="chip">${icon('scale', { size: 22 })} vereinfacht · keine Rechtsberatung</span>
    </header></div>
    <div class="law-a">
      <div class="duo d-law">
        <div class="card g reveal l1"><span class="chip green tag">nicht automatisch verboten</span><h3>Funktionen nachbauen</h3><p>Was ein Programm tut, neu umsetzen.</p></div>
        <div class="sym reveal l2">≠</div>
        <div class="card r reveal l3"><span class="chip rust tag">Urheberrecht</span><h3>Geschützten Code kopieren</h3><p>Fremden Quell- oder Maschinencode übernehmen.</p></div>
      </div>
      <div class="sites"><span class="sites-label">Eigene Baustellen:</span><b class="site reveal">Marken</b><b class="site reveal">Patente</b><b class="site reveal">Lizenzbedingungen</b></div>
    </div>
    <div class="debate card reveal">
      <div class="big">${icon('scale', { size: 64 })}</div>
      <div><span class="chip rust">heftig umstritten</span><h3>KI und Urheberrecht</h3><p>Was dürfen KI-Modelle aus fremder Software lernen?</p></div>
    </div>
    <div class="openq card reveal">
      <div class="big">${icon('question', { size: 64 })}</div>
      <div><h3>Bisher offen</h3><p>Wie würden Gerichte solche KI-Nachbauten bewerten?</p></div>
    </div>
  </div>`
}

function usScene() {
  return `
  <div class="scene us in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Für uns</p><h2>Software wird <em>austauschbarer</em></h2></div>
      <span class="chip ink">Der Wert liegt woanders</span>
    </header></div>
    <div class="tiles">
      <div class="tile card reveal t1"><div class="ic">${icon('brain', { size: 64 })}</div><h3>Ideen</h3></div>
      <div class="tile card reveal t2"><div class="ic">${icon('check', { size: 48 })}</div><h3>Erfahrung</h3></div>
      <div class="tile card reveal t3"><div class="ic">${icon('spark', { size: 56 })}</div><h3>Gute Ergebnisse</h3></div>
    </div>
  </div>`
}

function finaleScene() {
  return `
  <div class="scene finale-scene in">
    <div class="finale">
      <div>
        <div class="brain">${icon('brain', { size: 92 })}</div>
        <h2>KI macht das Nachbauen von Software so leicht <em>wie nie.</em></h2>
        <p class="ask"></p>
      </div>
    </div>
  </div>`
}

export function mountR3(root, { signal }) {
  root.innerHTML = waitScene()
  let scene = root.firstElementChild
  const $ = (s) => q(scene, s) || NULL_EL
  const on = (s) => $(s).classList.add('on')

  // Szenenwechsel: neue Szene sofort einsetzen (folgende Cues greifen direkt auf sie zu),
  // die alte blendet nur noch aus und wird danach entfernt. So überholen sich schnelle Cues nicht.
  async function swap(html) {
    const old = scene
    old.classList.remove('in')
    old.classList.add('out')
    audio.sfx('whoosh')
    root.insertAdjacentHTML('beforeend', html)
    scene = root.lastElementChild
    hydrateImages(scene)
    run(sleep(450, signal).then(() => old.remove()))
  }

  const later = (ms, fn) => run(sleep(ms, signal).then(fn))

  return {
    async artcraft() {
      await swap(artcraftScene())
    },
    weeks() {
      on('.weeks')
      audio.sfx('pop', { rate: 0.85 })
    },
    countApps() {
      const apps = qa(scene, '.app')
      const counter = $('.app-count b')
      run(animate(1700, (p) => {
        const n = Math.min(apps.length, Math.floor(p * apps.length + 0.0001) + (p > 0 ? 1 : 0))
        apps.forEach((a, i) => {
          if (i < n && !a.classList.contains('on')) {
            a.classList.add('on')
            audio.sfx('pop', { rate: 0.9 + i * 0.07, vol: 0.6 })
          }
        })
        counter.textContent = String(Math.min(n, 7))
      }, signal))
    },
    overview() {
      qa(scene, '.app').forEach((a) => a.classList.add('on'))
      $('.app-count b').textContent = String(ARTCRAFT_APPS.length)
      on('.ai-fact')
      on('.weeks')
    },
    photocraft() {
      on('.shot')
      audio.sfx('whoosh')
    },
    price() {
      on('.c0')
      audio.sfx('pop')
    },
    cleanRoomClaim() {
      on('.shot')
      on('.c1')
      audio.sfx('pop')
    },
    notFull() {
      on('.c2')
      on('.ribbon')
      audio.sfx('pop', { rate: 0.85 })
    },
    async decades() {
      await swap(decadesScene())
      const ps = $('.bfill.ps')
      run(animate(1600, (p) => (ps.style.width = `${xOf(Y0 + (Y1 - Y0) * ease.out(p)) - 0.01}%`), signal))
      later(1700, () => {
        on('.bfill.pc')
        on('.bnote')
        audio.sfx('pop', { rate: 1.3 })
      })
    },
    async heikel() {
      await swap(heikelScene())
      for (const [s, d] of [['.h1', 0], ['.h3', 700], ['.h2', 1300], ['.h4', 1600]]) later(d, () => { on(s); if (s !== '.h4') audio.sfx('pop') })
    },
    async law() {
      await swap(lawScene())
      for (const [s, d] of [['.l1', 0], ['.l2', 500], ['.l3', 800]]) later(d, () => { on(s); audio.sfx('pop') })
    },
    site(i) {
      qa(scene, '.site')[i]?.classList.add('on')
      audio.sfx('ui-move', { rate: 0.9 + i * 0.1 })
    },
    debate() {
      qa(scene, '.site').forEach((s) => s.classList.add('on'))
      scene.classList.add('s-debate')
      on('.debate')
      audio.sfx('whoosh')
    },
    open() {
      scene.classList.remove('s-debate')
      scene.classList.add('s-open')
      on('.openq')
      audio.sfx('sparkle', { vol: 0.6 })
    },
    async us() {
      await swap(usScene())
    },
    tile(i) {
      on(`.t${i + 1}`)
      audio.sfx('pop', { rate: 1 + i * 0.1 })
    },
    async finale() {
      await swap(finaleScene())
      audio.sfx('sparkle')
      later(1600, () =>
        typeInto($('.ask'), 'Wie schützen Softwarefirmen künftig, was sie einzigartig macht?', { cps: 24, signal }).then(() => ($('.ask').innerHTML += '<span class="cur"></span>')),
      )
    },
  }
}
