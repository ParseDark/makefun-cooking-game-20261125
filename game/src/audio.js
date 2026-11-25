// audio.js — all sound synthesized with WebAudio. No audio files.
// Lazily creates the AudioContext on first user gesture (browser policy).

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setMuted(m) { this.muted = m; }

  _tone(freq, dur, type, gain, slideTo) {
    if (this.muted) return;
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, gain) {
    if (this.muted) return;
    const ctx = this._ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.12, t0);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    src.connect(hp).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur);
  }

  sizzle() { this._noise(0.25, 0.1); } // cooking
  chop() { this._tone(180, 0.08, 'square', 0.12); } // chopping
  step() { this._tone(520, 0.08, 'triangle', 0.15); }
  ding() { // serve success
    this._tone(880, 0.12, 'sine', 0.2);
    setTimeout(() => this._tone(1320, 0.18, 'sine', 0.18), 90);
  }
  buzz() { this._tone(160, 0.3, 'sawtooth', 0.2, 80); } // error
  win() {
    [660, 880, 1100, 1320].forEach((f, i) =>
      setTimeout(() => this._tone(f, 0.22, 'sine', 0.2), i * 110));
  }
  fail() { this._tone(300, 0.5, 'sawtooth', 0.22, 120); }
  play(event) {
    switch (event) {
      case 'step': this.step(); break;
      case 'serve': this.ding(); break;
      case 'error': this.buzz(); break;
      case 'win': this.win(); break;
      case 'fail': this.fail(); break;
      case 'sizzle': this.sizzle(); break;
      case 'chop': this.chop(); break;
      default: break;
    }
  }
}
