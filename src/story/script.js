// Ablauf der drei Räume. Hier wird festgelegt, wann die Figur spricht, worauf sie wartet
// (Mikrofon, Knöpfe, Tür) und welche Animation auf der Präsentationsfläche zu welchem Satz läuft.
//
// Cues: [satzIndex, anteil 0..1, funktion]. at(seq, satz, 'Wort') berechnet den Anteil aus der
// Position eines Wortes im Satz – so passen die Cues auch nach kleinen Textänderungen noch.
import { SEQ } from '../engine/speech.js'
import { P } from '../game/palette.js'

export function at(seqId, i, word) {
  const s = SEQ[seqId]?.sentences[i] || ''
  const k = s.indexOf(word)
  return k < 0 ? 0 : Math.max(0, (k - 2) / s.length)
}

export const ROOM_SCRIPTS = {
  async r1(c) {
    const pr = c.pres
    const S = '01-intro'
    await c.trigger('mic', '<kbd>E</kbd>Ans Mikrofon')
    c.sfx('mic')
    c.world.st.onAir = true
    c.tween(600, (p) => (c.world.st.spot = p))
    c.gesture('wave', 1.2)
    c.brow('flash')
    await c.wait(500)
    await c.say(S, {
      cues: [
        [0, at(S, 0, 'Spielefusionen'), () => pr.agenda(0)],
        [0, at(S, 0, 'Reverse Engineering'), () => pr.agenda(1)],
        [0, at(S, 0, 'KI'), () => pr.agenda(2)],
        [0, at(S, 0, 'Softwarehersteller'), () => pr.agenda(3)],
        [1, at(S, 1, 'Videos'), () => pr.image(0)],
        [1, at(S, 1, 'verschiedene'), () => pr.image(1)],
        [1, at(S, 1, 'Spielmechaniken'), () => pr.image(2)],
        [1, at(S, 1, 'gemixt'), () => pr.image(3)],
        [2, 0, () => { pr.allImages(); c.lookDown(2600); c.gesture('point', 1.6) }],
        [2, at(S, 2, 'Figuren'), () => pr.tag('Figuren')],
        [2, at(S, 2, 'Spielwelten'), () => pr.tag('Spielwelten')],
        [2, at(S, 2, 'bewegt'), () => pr.tag('Bewegen')],
        [2, at(S, 2, 'baut'), () => pr.tag('Bauen')],
        [2, at(S, 2, 'kämpft'), () => pr.tag('Kämpfen')],
        [3, at(S, 3, 'Reverse Engineering'), () => { pr.define(); c.lookDown(1800) }],
        [4, at(S, 4, 'Mario'), () => { pr.example(); c.lookDown(1600) }],
        [5, at(S, 5, 'Tempo'), () => { pr.ai(); c.sparkleHead() }],
        [6, 0, () => { pr.teaser(); c.openDoor() }],
      ],
    })
    c.world.st.onAir = false
    c.tween(600, (p) => (c.world.st.spot = 1 - p))
    c.openDoor()
    await c.trigger('door', 'Durch die Tür <kbd>D</kbd>')
    return 'r2'
  },

  async r2(c) {
    const pr = c.pres
    const A = '02-compile'
    const B = '03-decompile-cleanroom'
    // Erst schreibt die Figur am Schreibtisch den Quellcode (Satz 1), dann kündigt sie den Compiler an
    // (Satz 2) und wartet auf den Sprung auf Button 1
    await c.toDesk()
    pr.editor()
    await c.wait(400)
    const TYPE_MS = 4600
    await c.say(A, {
      to: 2,
      cues: [
        [0, 0.03, () => { c.typeCode(TYPE_MS); pr.typeSource(TYPE_MS) }],
        [1, at(A, 1, 'schaut'), () => { pr.lookLeft(); c.lookDown(1500) }],
      ],
    })
    await c.trigger('btn-compile', '<kbd>␣</kbd>Auf <b>1</b> springen')
    c.buttonOn('btn-compile')
    c.compileFigure('btn-compile', P.lime)
    c.toBinary()
    pr.compilerOn()
    await c.say(A, {
      from: 2,
      cues: [
        [2, at(A, 2, 'übersetzt'), () => pr.compile()],
        [3, 0, () => pr.ship()],
        [4, at(A, 4, 'mühsam'), () => pr.puzzle()],
        [5, 0, () => pr.hintDecompile()],
      ],
    })
    await c.trigger('btn-decompile', '<kbd>␣</kbd>Auf <b>2</b> springen')
    c.buttonOn('btn-decompile')
    c.compileFigure('btn-decompile', P.rustXL)
    pr.decompile()
    const cuesB = [
        [1, 0, () => pr.typeReconstructed()],
        [2, 0, () => pr.notOriginal()],
        [2, at(B, 2, 'keine Kommentare'), () => pr.flagNames()],
        [2, at(B, 2, 'schwierig'), () => pr.cost(0)],
        [2, at(B, 2, 'zeitaufwendig'), () => pr.cost(1)],
        [2, at(B, 2, 'teuer'), () => pr.cost(2)],
        [3, at(B, 3, 'KI'), () => { pr.aiAnnotate(); c.sparkleHead() }],
        [4, 0, () => pr.mechanics()],
        [4, at(B, 4, 'Springen'), () => pr.transfer(0)],
        [4, at(B, 4, 'Kämpfen'), () => pr.transfer(1)],
        [5, 0, () => pr.bridge()],
        [6, 0, () => pr.cleanRoom(1)],
        [6, at(B, 6, 'beschreibt'), () => pr.cleanRoom(1.5)],
        [7, 0, () => pr.cleanRoom(2)],
        [8, 0, () => pr.cleanRoom(3)],
        [9, 0, () => { pr.cleanRoom(4); c.sparkleHead() }],
        [9, at(B, 9, 'Trennung'), () => { pr.cleanRoom(4.5); c.brow('skeptic') }],
        [10, 0, () => { pr.cleanRoom(5); c.openDoor() }],
    ]
    // Bis zum Mechanik-Transfer (Satz 5), dann der Gag, dann weiter mit Satz 6
    await c.say(B, { to: 5, cues: cuesB })
    await c.say('gag-jannik', {
      cues: [
        [0, 0.05, () => { c.brow('wiggle'); pr.gag() }],
        [0, at('gag-jannik', 0, 'dekompiliert'), () => c.selfDecompile(P.lime)],
        [0, 0.93, () => { c.wink(); c.brow('happy') }],
      ],
    })
    await c.say(B, { from: 5, cues: cuesB })
    c.openDoor()
    await c.trigger('door', 'Durch die Tür <kbd>D</kbd>')
    return 'r3'
  },

  async r3(c) {
    const pr = c.pres
    const S = '04-artcraft-outlook'
    await c.wait(700)
    await c.trigger('btn-artcraft', '<kbd>␣</kbd>Auf <b>ArtCraft</b> springen')
    c.buttonOn('btn-artcraft')
    c.sparkleHead()
    await pr.artcraft()
    await c.say(S, {
      cues: [
        [0, at(S, 0, 'Wochen'), () => pr.weeks()],
        [0, at(S, 0, 'sieben'), () => { pr.countApps(); c.tween(1700, (p) => (c.world.st.gallery = p * 7)) }],
        [1, 0, () => { pr.overview(); pr.photocraft(); c.world.st.gallery = 7 }],
        [1, at(S, 1, 'kostenlos'), () => pr.price()],
        [2, 0, () => pr.cleanRoomClaim()],
        [3, 0, () => pr.notFull()],
        [4, 0, () => { pr.decades(); c.brow('raise') }],
        [5, 0, () => { pr.heikel(); c.brow('skeptic') }],
        [6, 0, () => pr.law()],
        [6, at(S, 6, 'Marken'), () => pr.site(0)],
        [6, at(S, 6, 'Patente'), () => pr.site(1)],
        [6, at(S, 6, 'Lizenz'), () => pr.site(2)],
        [7, 0, () => pr.debate()],
        [8, 0, () => { pr.open(); c.brow('skeptic') }],
        [9, 0, () => pr.us()],
        [9, at(S, 9, 'Ideen'), () => pr.tile(0)],
        [9, at(S, 9, 'Erfahrung'), () => pr.tile(1)],
        [9, at(S, 9, 'Ergebnissen'), () => pr.tile(2)],
        [10, 0, () => { pr.finale(); c.brow('happy') }],
      ],
    })
    // Abschied: Video-Tipp im Abspann, Brain-Food-Wortspiel, guten Appetit
    await c.say('abschied', {
      cues: [
        [0, at('abschied', 0, 'Video-Tipp'), () => { pr.farewell(0); c.lookDown(1400) }],
        [1, at('abschied', 1, 'Frühstück'), () => { pr.farewell(1); c.gesture('wave', 2.4); c.brow('flash') }],
        [1, at('abschied', 1, 'Guten Appetit'), () => c.openDoor()],
      ],
    })
    c.openDoor()
    await c.trigger('door', 'Zum Abspann <kbd>D</kbd>')
    return 'end'
  },
}
