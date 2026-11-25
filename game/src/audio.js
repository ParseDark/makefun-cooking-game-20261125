// Line Cook Rush v3 — audio: every sound is synthesized with WebAudio.
// No audio files, no network. Created lazily on the first user gesture.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.volume = 0.5;
  }

  // Call from a click/key handler so the browser allows audio.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 0.25, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.2, filterFreq = 1800, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  // Named game sounds. Each is a tiny recipe of tones/noise.
  chop() { this.noise(0.09, 0.3, 2600); this.tone(190, 0.07, 'triangle', 0.2); }
  sizzle() { this.noise(0.35, 0.12, 5200); }
  ding() { this.tone(880, 0.14, 'sine', 0.22); this.tone(1318, 0.2, 'sine', 0.18, 0.08); }
  pop() { this.tone(520, 0.08, 'square', 0.12, 0, 760); }
  error() { this.tone(150, 0.22, 'sawtooth', 0.2, 0, 95); }
  serve() { this.tone(660, 0.12, 'sine', 0.22); this.tone(880, 0.12, 'sine', 0.22, 0.1); this.tone(1174, 0.22, 'sine', 0.2, 0.2); }
  burnt() { this.tone(220, 0.3, 'sawtooth', 0.22, 0, 70); this.noise(0.3, 0.15, 700, 0.05); }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.22, i * 0.13));
  }
  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.26, 'triangle', 0.2, i * 0.16));
  }
  tick() { this.tone(1050, 0.05, 'square', 0.08); }
}
