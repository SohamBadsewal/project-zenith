class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.rumble = null;
    this.roar = null;
  }
  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this._buildRumble();
    this._buildRoar();
  }
  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  _noiseBuffer(seconds = 2, pink = false) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (!pink) {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return buf;
  }
  click() {
    this.ensure(); this.resume();
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.08, false);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + 0.1);
    const tri = this.ctx.createOscillator();
    tri.type = 'triangle'; tri.frequency.setValueAtTime(420, t);
    tri.frequency.exponentialRampToValueAtTime(180, t + 0.06);
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.25, t + 0.004);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    tri.connect(tg); tg.connect(this.master);
    tri.start(t); tri.stop(t + 0.1);
  }
  whoosh(duration = 2.5) {
    this.ensure(); this.resume();
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(duration + 0.5, false);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(200, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + duration * 0.5);
    bp.frequency.exponentialRampToValueAtTime(600, t + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45, t + duration * 0.15);
    g.gain.setValueAtTime(0.45, t + duration * 0.5);
    g.gain.exponentialRampToValueAtTime(0.08, t + duration * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + duration + 0.1);
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(55, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + duration);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.35, t + duration * 0.3);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    sub.connect(sg); sg.connect(this.master);
    sub.start(t); sub.stop(t + duration + 0.1);
  }
  _buildRumble() {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 110; lp.Q.value = 6;
    out.connect(lp); lp.connect(this.master);
    const oscs = [];
    for (const f of [42, 56, 63]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f;
      o.connect(out); o.start();
      oscs.push(o);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(4, true); noise.loop = true;
    const nl = this.ctx.createBiquadFilter();
    nl.type = 'lowpass'; nl.frequency.value = 70;
    noise.connect(nl); nl.connect(out); noise.start();
    this.rumble = { out, oscs, noise, lp };
  }
  setTension(t) {
    if (!this.rumble) return;
    const g = Math.pow(Math.max(0, t), 1.4) * 0.55;
    this.rumble.out.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
    this.rumble.lp.frequency.setTargetAtTime(90 + t * 260, this.ctx.currentTime, 0.05);
    const det = t * 18;
    this.rumble.oscs.forEach((o, i) => o.detune.setTargetAtTime((i + 1) * det, this.ctx.currentTime, 0.05));
  }
  _buildRoar() {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(3, false); noise.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'lowpass'; bp.frequency.value = 600;
    noise.connect(bp); bp.connect(out);
    const sub = this.ctx.createOscillator();
    sub.type = 'sine'; sub.frequency.value = 48;
    const sg = this.ctx.createGain(); sg.gain.value = 0.7;
    sub.connect(sg); sg.connect(out);
    this.roar = { out, noise, sub, bp, started: false };
  }
  fireRoar() {
    this.ensure();
    if (this.roar.started) return;
    this.roar.started = true;
    const t = this.ctx.currentTime;
    this.roar.noise.start(t);
    this.roar.sub.start(t);
    this.roar.out.gain.setValueAtTime(0.0001, t);
    this.roar.out.gain.exponentialRampToValueAtTime(0.95, t + 0.25);
    this.roar.out.gain.setValueAtTime(0.9, t + 2.5);
    this.roar.out.gain.exponentialRampToValueAtTime(0.25, t + 6);
    this.roar.bp.frequency.setValueAtTime(800, t);
    this.roar.bp.frequency.exponentialRampToValueAtTime(220, t + 6);
  }
  fadeRoar(seconds = 1.2) {
    if (!this.roar || !this.roar.started) return;
    const t = this.ctx.currentTime;
    this.roar.out.gain.cancelScheduledValues(t);
    this.roar.out.gain.setValueAtTime(Math.max(0.0001, this.roar.out.gain.value), t);
    this.roar.out.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    this.roar.bp.frequency.setTargetAtTime(90, t, seconds * 0.4);
    if (this.rumble) this.rumble.out.gain.setTargetAtTime(0, t, seconds * 0.4);
  }
  spaceHum() {
    this.ensure(); this.resume();
    if (this.hum) return;
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(6, true); noise.loop = true;
    noise.connect(lp); lp.connect(out);
    const pad = this.ctx.createOscillator();
    pad.type = 'sine'; pad.frequency.value = 64;
    const pg = this.ctx.createGain(); pg.gain.value = 0.4;
    pad.connect(pg); pg.connect(out);
    noise.start(); pad.start();
    out.gain.setTargetAtTime(0.18, this.ctx.currentTime, 1.5);
    this.hum = { out, noise, pad };
  }
  fadeHum(seconds = 1.0) {
    if (!this.hum) return;
    const t = this.ctx.currentTime;
    this.hum.out.gain.cancelScheduledValues(t);
    this.hum.out.gain.setValueAtTime(Math.max(0.0001, this.hum.out.gain.value), t);
    this.hum.out.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    const self = this;
    setTimeout(() => {
      if (self.hum) {
        try { self.hum.noise.stop(); } catch (e) {}
        try { self.hum.pad.stop(); } catch (e) {}
        self.hum = null;
      }
    }, seconds * 1000 + 100);
  }
  stopLaunch() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.roar && this.roar.started) {
      try {
        this.roar.out.gain.cancelScheduledValues(t);
        this.roar.out.gain.setValueAtTime(0.0001, t);
      } catch (e) {}
    }
    if (this.rumble) {
      try {
        this.rumble.out.gain.cancelScheduledValues(t);
        this.rumble.out.gain.setValueAtTime(0.0001, t);
      } catch (e) {}
    }
  }
}
export const audio = new AudioEngine();
