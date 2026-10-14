// Raum 1 – Spielefusionen: Agenda, vier Beispielbilder, Definition Reverse Engineering, Rolle der KI.
import { FUSIONS } from '../data/media.js'
import { icon } from '../ui/icons.js'
import { audio } from '../engine/audio.js'
import { imgTag, hydrateImages, q, qa } from './util.js'

const AGENDA = ['Spielefusionen', 'Reverse Engineering', 'KI', 'Softwarehersteller']

export function mountR1(root) {
  root.innerHTML = `
  <div class="p r1 scene in">
    <header class="p-head">
      <div><p class="eyebrow">Raum 1 · Spielefusionen</p><h2>Wenn Spiele <em>verschmelzen</em></h2></div>
      <ol class="agenda" aria-label="Worum es heute geht">
        ${AGENDA.map((a, i) => `<li data-i="${i}"><b>${i + 1}</b>${a}</li>`).join('')}
      </ol>
    </header>
    <div class="fusions">
      ${FUSIONS.map((f, i) => `
        <figure class="fcard" data-i="${i}">
          <div class="fimg">${imgTag(f.file, f.title)}<span class="fnum">${i + 1}</span></div>
          <figcaption>
            <strong>${f.title}</strong>
            <span class="fsub">${f.sub}</span>
            <div class="ftags">${f.tags.map((t) => `<i data-tag="${t}">${t}</i>`).join('')}</div>
            <small class="fcredit">${f.credit}</small>
          </figcaption>
        </figure>`).join('')}
    </div>
    <div class="callouts">
      <div class="callout card define reveal">
        <div class="ic">${icon('search', { size: 46 })}</div>
        <h3>Reverse Engineering</h3>
        <p>Fertige Software untersuchen, um ihre Funktionsweise zu verstehen.</p>
        <div class="chips"><span>Ansätze in den Beispielen:</span><b class="chip">Mod</b><b class="chip">Game Bridge</b><b class="chip">Neuimplementierung</b></div>
      </div>
      <div class="callout card ai reveal">
        <div class="ic">${icon('spark', { size: 46 })}</div>
        <h3>+ KI</h3>
        <p>kann aufwendige Analyse- und Programmierarbeit vereinfachen und beschleunigen.</p>
        <div class="chips"><span>Beispiel: Minecraft × GTA V entstand laut README mit „universal-modder“, einem Werkzeugkasten für KI-Coding-Agenten.</span></div>
      </div>
    </div>
    <div class="teaser reveal">Wie das funktioniert? Hinter der Tür ${icon('arrow', { size: 26 })}</div>
  </div>`
  hydrateImages(root)
  const $ = (s) => q(root, s)

  return {
    agenda(i) {
      const li = qa(root, '.agenda li')[i]
      if (li && !li.classList.contains('on')) {
        li.classList.add('on')
        audio.sfx('ui-move')
      }
    },
    image(i) {
      const c = qa(root, '.fcard')[i]
      if (!c || c.classList.contains('in')) return
      c.classList.add('in')
      audio.sfx('pop', { rate: 1 + i * 0.06 })
    },
    allImages() {
      FUSIONS.forEach((_, i) => this.image(i))
    },
    tag(name) {
      qa(root, `.ftags i[data-tag="${name}"]`).forEach((t) => {
        t.classList.add('on')
        const card = t.closest('.fcard')
        card.querySelector('.fimg').classList.remove('pulse')
        void card.offsetWidth
        card.querySelector('.fimg').classList.add('pulse')
      })
      audio.sfx('ui-move', { rate: 1.2 })
    },
    define() {
      this.allImages()
      $('.fusions').classList.add('dim')
      $('.define').classList.add('on')
      audio.sfx('whoosh')
    },
    ai() {
      $('.ai').classList.add('on')
      audio.sfx('sparkle')
    },
    teaser() {
      $('.teaser').classList.add('on')
    },
  }
}
