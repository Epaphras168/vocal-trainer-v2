// Skill-level progression, adaptive tolerance, session summaries & weak-spot analysis.

import { midiToName, INTERVALS, NOTE_NAMES } from "./audio/notes";

// 5 skill levels: base tolerance (cents) & required hold time (s) & content richness.
export const LEVELS = [
  { level: 1, tolerance: 45, hold: 1.0, label: "Novice" },
  { level: 2, tolerance: 35, hold: 1.2, label: "Rising" },
  { level: 3, tolerance: 25, hold: 1.4, label: "Steady" },
  { level: 4, tolerance: 18, hold: 1.7, label: "Refined" },
  { level: 5, tolerance: 12, hold: 2.0, label: "Master" },
];

export function levelConfig(level) {
  return LEVELS[Math.min(LEVELS.length, Math.max(1, level)) - 1];
}

// Adaptive tolerance: tighten when consistently accurate, loosen when struggling.
// history = array of booleans (recent hits/misses) for a module.
export function adaptTolerance(baseTolerance, recentResults) {
  if (recentResults.length < 5) return baseTolerance;
  const window = recentResults.slice(-8);
  const acc = window.filter(Boolean).length / window.length;
  if (acc >= 0.85) return Math.max(8, baseTolerance - 6);
  if (acc <= 0.45) return Math.min(60, baseTolerance + 8);
  return baseTolerance;
}

// Should the user level up? 80%+ over a rolling window of >=10 attempts.
export function shouldLevelUp(moduleAttempts) {
  const window = moduleAttempts.slice(-15);
  if (window.length < 10) return false;
  const acc = window.filter((a) => a.correct).length / window.length;
  return acc >= 0.8;
}

export function accuracyOf(attempts) {
  if (!attempts.length) return 0;
  return attempts.filter((a) => a.correct).length / attempts.length;
}

// Register band label from a midi number (e.g. "G4").
function bandLabel(midi) {
  return midiToName(midi);
}

// ---- Weak spot analysis ----
// attempts: [{module, targetMidi, cents, correct, interval, ts}]
export function analyzeWeakSpots(attempts) {
  const result = {
    flatSharpBias: null,
    weakRegister: null,
    weakInterval: null,
    registerData: [],
    intervalData: [],
    recommendations: [],
    totalAttempts: attempts.length,
    overallAccuracy: accuracyOf(attempts),
    avgCents: 0,
  };
  if (!attempts.length) return result;

  const withCents = attempts.filter((a) => typeof a.cents === "number" && isFinite(a.cents));
  const avgCents =
    withCents.reduce((s, a) => s + a.cents, 0) / (withCents.length || 1);
  result.avgCents = avgCents;

  // Overall flat/sharp bias
  const flatCount = withCents.filter((a) => a.cents < -8).length;
  const sharpCount = withCents.filter((a) => a.cents > 8).length;
  if (avgCents < -6) result.flatSharpBias = { dir: "flat", cents: Math.abs(avgCents), flatCount, sharpCount };
  else if (avgCents > 6) result.flatSharpBias = { dir: "sharp", cents: avgCents, flatCount, sharpCount };
  else result.flatSharpBias = { dir: "centered", cents: Math.abs(avgCents), flatCount, sharpCount };

  // Per note-name register accuracy & bias (group by note letter+octave via nearest)
  const byNote = {};
  for (const a of withCents) {
    if (a.targetMidi == null) continue;
    const key = bandLabel(a.targetMidi);
    if (!byNote[key]) byNote[key] = { note: key, midi: a.targetMidi, attempts: 0, correct: 0, centsSum: 0 };
    byNote[key].attempts++;
    if (a.correct) byNote[key].correct++;
    byNote[key].centsSum += a.cents;
  }
  const registerData = Object.values(byNote)
    .map((r) => ({
      ...r,
      accuracy: r.correct / r.attempts,
      avgCents: r.centsSum / r.attempts,
    }))
    .sort((x, y) => x.midi - y.midi);
  result.registerData = registerData;

  const weakReg = registerData
    .filter((r) => r.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  if (weakReg) result.weakRegister = weakReg;

  // Per interval accuracy
  const byInterval = {};
  for (const a of attempts) {
    if (!a.interval) continue;
    const meta = INTERVALS.find((i) => i.id === a.interval);
    const key = a.interval;
    if (!byInterval[key])
      byInterval[key] = { id: key, label: meta ? meta.label : String(key), attempts: 0, correct: 0, centsSum: 0 };
    byInterval[key].attempts++;
    if (a.correct) byInterval[key].correct++;
    if (typeof a.cents === "number") byInterval[key].centsSum += a.cents;
  }
  const intervalData = Object.values(byInterval).map((r) => ({
    ...r,
    accuracy: r.correct / r.attempts,
    avgCents: r.centsSum / r.attempts,
  }));
  result.intervalData = intervalData;
  const weakInt = intervalData
    .filter((r) => r.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  if (weakInt) result.weakInterval = weakInt;

  // Build human recommendations
  const recs = [];
  if (result.flatSharpBias && result.flatSharpBias.dir !== "centered") {
    recs.push(
      `You tend to sing ${result.flatSharpBias.dir} by ~${Math.round(
        result.flatSharpBias.cents
      )} cents on average. Focus on ${
        result.flatSharpBias.dir === "flat" ? "lifting into" : "relaxing onto"
      } each target pitch.`
    );
  }
  if (weakReg && weakReg.accuracy < 0.7) {
    const dir = weakReg.avgCents < -6 ? "flat" : weakReg.avgCents > 6 ? "sharp" : "unstable";
    recs.push(
      `Notes around ${weakReg.note} are your weakest register (${Math.round(
        weakReg.accuracy * 100
      )}% accurate${dir !== "unstable" ? `, trending ${dir}` : ""}). Add slow sirens through this area.`
    );
  }
  if (weakInt && weakInt.accuracy < 0.7) {
    recs.push(
      `${weakInt.label}s are your least accurate interval (${Math.round(
        weakInt.accuracy * 100
      )}%). Drill them in Interval Ear Training.`
    );
  }
  if (!recs.length) {
    recs.push("Great consistency so far — keep practising daily to unlock tighter tolerance levels.");
  }
  result.recommendations = recs;
  return result;
}

// Build a session summary from a set of attempts recorded during a session.
export function buildSessionSummary(sessionAttempts, prevSession) {
  const total = sessionAttempts.length;
  const hits = sessionAttempts.filter((a) => a.correct).length;
  const withCents = sessionAttempts.filter((a) => typeof a.cents === "number" && isFinite(a.cents));
  const avgCents = withCents.length
    ? withCents.reduce((s, a) => s + Math.abs(a.cents), 0) / withCents.length
    : 0;
  const accuracy = total ? hits / total : 0;
  const summary = {
    ts: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    total,
    hits,
    accuracy,
    avgCents,
  };
  if (prevSession) {
    summary.deltaAccuracy = accuracy - prevSession.accuracy;
    summary.deltaCents = avgCents - prevSession.avgCents;
  }
  return summary;
}

export { NOTE_NAMES };
