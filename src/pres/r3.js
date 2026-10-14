// Raum 3 – ArtCraft und Ausblick: Übersicht der sieben Nachbauten, PhotoCraft, Entwicklerangaben,
// mögliche Folgen, rechtliche Einordnung und der offene Schlussgedanke.
import { ARTCRAFT, ARTCRAFT_APPS } from '../data/media.js'
import { icon } from '../ui/icons.js'
import { audio } from '../engine/audio.js'
import { animate, sleep } from '../engine/clock.js'
import { q, qa, run, imgTag, hydrateImages, MEDIA, typeInto, NULL_EL } from './util.js'

function waitScene() {
  return `
  <div class="scene wait in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Software-Atelier</p><h2>Nicht nur <em>Spiele</em></h2></div>
      <span class="chip">Button ArtCraft ↑</span>
    </header></div>
  </div>`
}

function artcraftScene() {
  return `
  <div class="scene artcraft in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Nicht nur Spiele</p><h2>ArtCraft: Software <em>neu gebaut</em></h2></div>
      <span class="chip ink">${icon('spark', { size: 18 })} mit KI-Unterstützung</span>
    </header></div>
    <div class="apps-wrap">
      <div class="app-count"><b>0</b><span>bekannte Adobe-Anwendungen<br>nachgebaut – die „Craft Apps“</span></div>
      <div class="apps">
        ${ARTCRAFT_APPS.map((a) => `
          <div class="app"><img src="${MEDIA}${a.icon}" alt="" onerror="this.style.visibility='hidden'">
            <div><strong>${a.name.replace('Craft', `<span class="acc" style="color:${a.color}">Craft</span>`)}</strong><small>inspiriert von Adobe ${a.like}</small></div></div>`).join('')}
      </div>
      <p class="ai-fact reveal">Quelle: getartcraft.com · github.com/storytold (Stand 14.10.2026)</p>
    </div>
    <div class="shot">
      <div class="bar"><i></i><i></i><i></i>&nbsp;PhotoCraft · Early Alpha</div>
      <div class="frame">${imgTag(ARTCRAFT.photocraft, 'PhotoCraft-Oberfläche')}</div>
      <p class="credit">${ARTCRAFT.photocraftCredit}</p>
      <span class="chip rust ribbon">noch kein Vollersatz</span>
    </div>
    <div class="claims">
      <div class="claim card c1"><span class="chip green">Laut Entwicklern</span>
        <p>Clean-Room-Implementierungen: öffentliche Beschreibungen und beobachtetes Verhalten statt Adobes Originalcode.</p>
        <q>implemented from public specs and observed behaviour only</q></div>
      <div class="claim card warn c2"><span class="chip rust">Laut Projekt</span>
        <p>PhotoCraft bietet viele bekannte Funktionen – ist aber noch kein vollständiger Ersatz für professionelle Photoshop-Arbeit.</p></div>
    </div>
  </div>`
}

function outlookScene() {
  return `
  <div class="scene outlook in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Ausblick</p><h2>Was könnte das <em>bedeuten?</em></h2></div>
      <span class="chip">Möglichkeiten, keine Prognose</span>
    </header></div>
    <div class="duo">
      <div class="card g reveal o1"><span class="chip lime tag">möglich</span><h3>Mehr Alternativen</h3><p>Nachbauten bekannter Programme könnten schneller entstehen.</p></div>
      <div class="sym reveal o2">+</div>
      <div class="card r reveal o3"><span class="chip rust tag">möglich</span><h3>Mehr Druck</h3><p>Etablierte Softwarehersteller könnten stärker unter Druck geraten.</p></div>
    </div>
  </div>`
}

function lawScene() {
  return `
  <div class="scene law in">
    <div class="p"><header class="p-head">
      <div><p class="eyebrow">Raum 3 · Rechtliche Einordnung</p><h2>Nachbauen ≠ <em>kopieren</em></h2></div>
      <span class="chip">${icon('scale', { size: 22 })} vereinfacht</span>
    </header></div>
    <div class="duo d-law">
      <div class="card g reveal l1"><span class="chip green tag">Funktionen</span><h3>Funktionen nachbauen</h3><p>Was ein Programm tut, neu umsetzen.</p></div>
      <div class="sym reveal l2">≠</div>
      <div class="card r reveal l3"><span class="chip rust tag">Code</span><h3>Geschützten Code kopieren</h3><p>Fremden Quell- oder Maschinencode übernehmen.</p></div>
    </div>
    <div class="openq card reveal l4" hidden>
      <div class="big">${icon('question', { size: 64 })}</div>
      <div><h3>Bleibt spannend</h3><p>Wie werden konkrete KI-Nachbauten rechtlich bewertet – und hält ihr behaupteter Clean-Room-Prozess einer Prüfung stand?</p></div>
    </div>
    <div class="foot-note reveal l5"><b>HINWEIS</b> Nicht automatisch eine Urheberrechtsverletzung – aber auch keine Freikarte: Marken, Patente und Lizenzen bleiben eigene Fragen. Keine Rechtsberatung.</div>
  </div>`
}

function finaleScene() {
  return `
  <div class="scene finale-scene in">
    <div class="finale">
      <div>
        <div class="brain">${icon('brain', { size: 92 })}</div>
        <h2>KI macht das Nachbauen von Software <em>leichter.</em></h2>
        <p class="ask"></p>
      </div>
    </div>
  </div>`
}

export function mountR3(root, { signal }) {
  root.innerHTML = waitScene()
  let scene = root.firstElementChild
  const $ = (s) => q(scene, s) || NULL_EL

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

  return {
    async artcraft() {
      await swap(artcraftScene())
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
      $('.ai-fact').classList.add('on')
    },
    photocraft() {
      $('.shot').classList.add('on')
      audio.sfx('whoosh')
    },
    cleanRoomClaim() {
      $('.shot').classList.add('on')
      $('.c1').classList.add('on')
      audio.sfx('pop')
    },
    notFull() {
      $('.c2').classList.add('on')
      $('.ribbon').classList.add('on')
      audio.sfx('pop', { rate: 0.85 })
    },
    async outlook() {
      await swap(outlookScene())
      for (const [s, d] of [['.o1', 0], ['.o2', 500], ['.o3', 900]]) {
        run(sleep(d, signal).then(() => { $(s).classList.add('on'); audio.sfx('pop') }))
      }
    },
    async law() {
      await swap(lawScene())
      for (const [s, d] of [['.l1', 0], ['.l2', 600], ['.l3', 1000], ['.l5', 1800]]) {
        run(sleep(d, signal).then(() => { $(s).classList.add('on'); if (s !== '.l5') audio.sfx('pop') }))
      }
    },
    open() {
      $('.d-law').style.opacity = '0'
      $('.d-law').style.transition = 'opacity .4s'
      const oq = $('.openq')
      oq.hidden = false
      requestAnimationFrame(() => oq.classList.add('on'))
      audio.sfx('sparkle', { vol: 0.6 })
    },
    async finale() {
      await swap(finaleScene())
      audio.sfx('sparkle')
      run(sleep(1600, signal).then(() =>
        typeInto($('.ask'), 'Wie sehr verändert das die Softwarewelt?', { cps: 22, signal }),
      ).then(() => ($('.ask').innerHTML += '<span class="cur"></span>')))
    },
  }
}
