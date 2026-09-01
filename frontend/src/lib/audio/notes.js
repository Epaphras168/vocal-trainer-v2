// Music theory helpers — Equal Temperament, A4 = 440Hz

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const A4 = 440;
export const A4_MIDI = 69;

// Speaker-safe playback floor: C3 (~130.81Hz). Many device speakers can't reproduce lower cleanly.
export const SAFE_LOW_MIDI = 48; // C3
export const SAFE_HIGH_MIDI = 84; // C6

export function midiToFreq(midi) {
  return A4 * Math.pow(2, (midi - A4_MIDI) / 12);
}

export function freqToMidiFloat(freq) {
  return 12 * (Math.log(freq / A4) / Math.log(2)) + A4_MIDI;
}

export function freqToMidi(freq) {
  return Math.round(freqToMidiFloat(freq));
}

// cents deviation of freq from nearest note (or from a specific midi if provided)
export function centsOff(freq, targetMidi = null) {
  const midi = targetMidi != null ? targetMidi : freqToMidi(freq);
  return 1200 * (Math.log(freq / midiToFreq(midi)) / Math.log(2));
}

export function midiToName(midi) {
  const m = Math.round(midi);
  const name = NOTE_NAMES[((m % 12) + 12) % 12];
  const octave = Math.floor(m / 12) - 1;
  return `${name}${octave}`;
}

export function nameToMidi(name) {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name.trim());
  if (!match) return null;
  const idx = NOTE_NAMES.indexOf(match[1]);
  if (idx < 0) return null;
  return idx + (parseInt(match[2], 10) + 1) * 12;
}

// clamp a midi into the speaker-safe playable band by shifting octaves
export function clampToSafeOctave(midi) {
  let m = midi;
  while (m < SAFE_LOW_MIDI) m += 12;
  while (m > SAFE_HIGH_MIDI) m -= 12;
  return m;
}

export const SCALES = {
  major: { label: "Major", steps: [0, 2, 4, 5, 7, 9, 11, 12] },
  minor: { label: "Natural Minor", steps: [0, 2, 3, 5, 7, 8, 10, 12] },
  pentatonic: { label: "Major Pentatonic", steps: [0, 2, 4, 7, 9, 12] },
  harmonic: { label: "Harmonic Minor", steps: [0, 2, 3, 5, 7, 8, 11, 12] },
  blues: { label: "Blues", steps: [0, 3, 5, 6, 7, 10, 12] },
};

export const INTERVALS = [
  { id: "m2", label: "Minor 2nd", short: "m2", semitones: 1 },
  { id: "M2", label: "Major 2nd", short: "M2", semitones: 2 },
  { id: "m3", label: "Minor 3rd", short: "m3", semitones: 3 },
  { id: "M3", label: "Major 3rd", short: "M3", semitones: 4 },
  { id: "P4", label: "Perfect 4th", short: "P4", semitones: 5 },
  { id: "TT", label: "Tritone", short: "TT", semitones: 6 },
  { id: "P5", label: "Perfect 5th", short: "P5", semitones: 7 },
  { id: "m6", label: "Minor 6th", short: "m6", semitones: 8 },
  { id: "M6", label: "Major 6th", short: "M6", semitones: 9 },
  { id: "m7", label: "Minor 7th", short: "m7", semitones: 10 },
  { id: "M7", label: "Major 7th", short: "M7", semitones: 11 },
  { id: "P8", label: "Octave", short: "P8", semitones: 12 },
];

// Voice type classification from vocal range (midi values)
export function classifyVoice(lowMidi, highMidi) {
  const center = (lowMidi + highMidi) / 2;
  // Reference centers roughly: Bass~E3, Baritone~A3, Tenor~C4, Alto~E4, Mezzo~G4, Soprano~B4
  const types = [
    { type: "Bass", center: nameToMidi("E3"), range: "E2 – E4" },
    { type: "Baritone", center: nameToMidi("G3"), range: "A2 – A4" },
    { type: "Tenor", center: nameToMidi("C4"), range: "C3 – C5" },
    { type: "Alto", center: nameToMidi("F4"), range: "F3 – F5" },
    { type: "Mezzo-Soprano", center: nameToMidi("A4"), range: "A3 – A5" },
    { type: "Soprano", center: nameToMidi("C5"), range: "C4 – C6" },
  ];
  let best = types[0];
  let bestDist = Infinity;
  for (const t of types) {
    const d = Math.abs(center - t.center);
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  return best;
}
