// Sprechrhythmus ohne Audio: Silben unterschiedlicher Länge und Stärke mit kurzen Pausen.
// Liefert pro Frame eine Mundöffnung 0..1. Mit Audio übernimmt der Pegel der Aufnahme (audio.js).
export class Babble {
  constructor() {
    this.phase = 0
    this.syl = 0.17
    this.amp = 0.7
    this.gap = 0
  }

  update(dt, active) {
    if (!active) return 0
    if (this.gap > 0) {
      this.gap -= dt
      return 0.04
    }
    this.phase += dt / this.syl
    if (this.phase >= 1) {
      this.phase -= 1
      this.syl = 0.11 + Math.random() * 0.15
      this.amp = 0.4 + Math.random() * 0.6
      if (Math.random() < 0.13) this.gap = 0.07 + Math.random() * 0.16
    }
    return Math.sin(this.phase * Math.PI) * this.amp
  }
}
