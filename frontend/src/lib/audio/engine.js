// Shared audio engine: single AudioContext, mic analyser + rAF pitch loop,
// and OscillatorNode-based reference tone synth. Frontend-only, no files.

import { autoCorrelate, PitchSmoother } from "./pitch";
import { freqToMidi, centsOff, midiToName, midiToFreq, clampToSafeOctave } from "./notes";

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.micStream = null;
    this.source = null;
    this.buffer = null;
    this.running = false;
    this.rafId = null;
    this.listeners = new Set();
    this.smoother = new PitchSmoother(6);
    this.latest = { freq: -1, midi: null, note: "—", cents: 0, clarity: 0, volume: 0 };
    this.permission = "unknown"; // unknown | granted | denied
  }

  async ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  async startMic() {
    await this.ensureContext();
    if (this.running) return { ok: true };
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
      this.permission = "granted";
    } catch (err) {
      this.permission = "denied";
      return { ok: false, error: err?.name || "error" };
    }
    this.source = this.ctx.createMediaStreamSource(this.micStream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.source.connect(this.analyser);
    this.running = true;
    this.smoother.reset();
    this._loop();
    return { ok: true };
  }

  stopMic() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.analyser = null;
    this.latest = { freq: -1, midi: null, note: "—", cents: 0, clarity: 0, volume: 0 };
  }

  _loop() {
    if (!this.running || !this.analyser) return;
    this.analyser.getFloatTimeDomainData(this.buffer);
    const { freq, clarity, rms } = autoCorrelate(this.buffer, this.ctx.sampleRate);
    const smooth = this.smoother.push(freq);
    const volume = Math.min(1, rms / 0.18);

    if (smooth > 0) {
      const midi = freqToMidi(smooth);
      this.latest = {
        freq: smooth,
        midi,
        note: midiToName(midi),
        cents: centsOff(smooth, midi),
        clarity,
        volume,
      };
    } else {
      this.latest = { freq: -1, midi: null, note: "—", cents: 0, clarity, volume };
    }

    for (const fn of this.listeners) {
      fn(this.latest, this.buffer, this.ctx.sampleRate);
    }
    this.rafId = requestAnimationFrame(() => this._loop());
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Play a single tone by frequency with a gentle ADSR to avoid clicks.
  async playFreq(freq, duration = 0.7, type = "triangle", gainLevel = 0.22) {
    await this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.05);
    gain.gain.setValueAtTime(gainLevel, now + Math.max(0.06, duration - 0.15));
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
    return new Promise((res) => setTimeout(res, duration * 1000));
  }

  // Play a note by midi, transposed into the speaker-safe octave band.
  async playMidi(midi, duration = 0.7, type = "triangle") {
    const safe = clampToSafeOctave(midi);
    return this.playFreq(midiToFreq(safe), duration, type);
  }

  // Play a sequence of midi notes. onNote(index) fires as each begins.
  async playSequence(midis, noteDur = 0.55, gap = 0.08, onNote = null) {
    for (let i = 0; i < midis.length; i++) {
      if (onNote) onNote(i, midis[i]);
      await this.playMidi(midis[i], noteDur);
      if (gap) await new Promise((r) => setTimeout(r, gap * 1000));
    }
  }
}

const engine = new AudioEngine();
export default engine;
