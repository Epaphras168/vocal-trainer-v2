// Autocorrelation-based pitch detection with parabolic interpolation.
// Returns { freq, clarity, rms }. freq = -1 when no reliable pitch.

export function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const v = buf[i];
    rms += v * v;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return { freq: -1, clarity: 0, rms };

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const b = buf.slice(r1, r2);
  const size = b.length;
  if (size < 4) return { freq: -1, clarity: 0, rms };

  const c = new Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += b[j] * b[j + i];
    }
  }

  let d = 0;
  while (d < size - 1 && c[d] > c[d + 1]) d++;

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  if (T0 <= 0) return { freq: -1, clarity: 0, rms };

  const x1 = c[T0 - 1] || 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);

  const freq = sampleRate / T0;
  const clarity = c[0] ? maxval / c[0] : 0;

  if (freq < 60 || freq > 1500) return { freq: -1, clarity, rms };
  return { freq, clarity, rms };
}

// Rolling median smoother to prevent flickering note detection.
export class PitchSmoother {
  constructor(size = 6) {
    this.size = size;
    this.buf = [];
  }
  push(freq) {
    if (freq <= 0) {
      // decay: a single dropout shouldn't clear the whole buffer
      if (this.buf.length) this.buf.shift();
      return this.value();
    }
    this.buf.push(freq);
    if (this.buf.length > this.size) this.buf.shift();
    return this.value();
  }
  value() {
    if (!this.buf.length) return -1;
    const sorted = [...this.buf].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }
  reset() {
    this.buf = [];
  }
}
