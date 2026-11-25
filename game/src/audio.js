// Line Cook Rush — every sound is synthesized with WebAudio. No audio files,
// no network: short oscillator blips and filtered noise bursts do the work.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  // Browsers only allow audio after a user gesture; call this from the first
  // key or click and it becomes a no-op afterwards.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  tone(freq, { dur = 0.12, type = 'sine', vol = 0.5, slideTo = null, delay = 0 } = {}) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.15, vol = 0.4, freq = 1200, q = 1, delay = 0 } = {}) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  click() {
    this.tone(660, { dur: 0.06, type: 'triangle', vol: 0.25 });
  }

  chop() {
    this.noise({ dur: 0.09, vol: 0.5, freq: 2400, q: 0.8 });
    this.tone(180, { dur: 0.08, type: 'triangle', vol: 0.3 });
  }

  sizzle() {
    this.noise({ dur: 0.4, vol: 0.3, freq: 5200, q: 0.6 });
  }

  ding() {
    this.tone(880, { dur: 0.15, vol: 0.4 });
    this.tone(1318, { dur: 0.22, vol: 0.35, delay: 0.09 });
  }

  buzz() {
    this.tone(140, { dur: 0.28, type: 'sawtooth', vol: 0.35, slideTo: 90 });
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, { dur: 0.22, vol: 0.4, delay: i * 0.11 }));
  }

  fail() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, { dur: 0.25, type: 'triangle', vol: 0.35, delay: i * 0.13 }));
  }

  play(name) {
    this.ensure();
    if (!this.ctx) return;
    if (name === 'click') this.click();
    else if (name === 'chop') this.chop();
    else if (name === 'sizzle') this.sizzle();
    else if (name === 'ding') this.ding();
    else if (name === 'buzz') this.buzz();
    else if (name === 'win') this.win();
    else if (name === 'fail') this.fail();
  }
}
