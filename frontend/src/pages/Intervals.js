import React, { useState, useCallback } from "react";
import { Music, Play, Ear, RotateCcw, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { midiToName, INTERVALS, SAFE_LOW_MIDI, SAFE_HIGH_MIDI } from "@/lib/audio/notes";
import { levelConfig, adaptTolerance } from "@/lib/progression";
import { usePitchTarget } from "@/hooks/usePitchTarget";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import TuningMeter from "@/components/TuningMeter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_SELECTED = ["M2", "M3", "P4", "P5", "P8"];

export default function Intervals() {
  const { engine, profile, micRunning, recordAttempt, getLevel } = useApp();
  const level = getLevel("intervals");
  const cfg = levelConfig(level);
  const lo = Math.max(SAFE_LOW_MIDI, profile.rangeLow ?? SAFE_LOW_MIDI);
  const hi = Math.min(SAFE_HIGH_MIDI, profile.rangeHigh ?? 72);

  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [challenge, setChallenge] = useState(null); // {root, target, interval, direction}
  const [score, setScore] = useState(0);
  const [recent, setRecent] = useState([]);
  const [reveal, setReveal] = useState(false);

  const tolerance = adaptTolerance(cfg.tolerance, recent);

  const toggle = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const pick = useCallback(() => {
    const pool = INTERVALS.filter((i) => selected.includes(i.id));
    if (!pool.length) return null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const iv = pool[Math.floor(Math.random() * pool.length)];
      const dir = Math.random() < 0.5 ? "up" : "down";
      let rLo, rHi;
      if (dir === "up") { rLo = lo; rHi = hi - iv.semitones; }
      else { rLo = lo + iv.semitones; rHi = hi; }
      if (rHi < rLo) continue;
      const root = rLo + Math.floor(Math.random() * (rHi - rLo + 1));
      const target = dir === "up" ? root + iv.semitones : root - iv.semitones;
      return { root, target, interval: iv.id, label: iv.label, direction: dir };
    }
    return null;
  }, [selected, lo, hi]);

  const start = () => {
    const c = pick();
    if (c) {
      setReveal(false);
      setChallenge(c);
      setTimeout(() => engine.playMidi(c.root, 1.2), 200);
    }
  };

  const onHit = useCallback((cents) => {
    setScore((s) => s + 1);
    setRecent((r) => [...r, true].slice(-12));
    recordAttempt({ module: "intervals", targetMidi: challenge.target, cents, correct: true, interval: challenge.interval });
    setReveal(true);
    setTimeout(() => start(), 1500);
  }, [challenge, recordAttempt]);

  const { progress, cents, detecting, sungNote } = usePitchTarget({
    active: micRunning && !!challenge && !reveal,
    targetMidi: challenge?.target ?? null,
    tolerance,
    holdTime: cfg.hold,
    allowOctave: false,
    onHit,
  });

  const skip = () => {
    if (challenge) {
      setRecent((r) => [...r, false].slice(-12));
      recordAttempt({ module: "intervals", targetMidi: challenge.target, cents: null, correct: false, interval: challenge.interval });
    }
    start();
  };

  return (
    <ModuleShell
      icon={Music}
      title="Interval Ear Training"
      subtitle="Hear only the root. Find the named interval by ear and sing it — the target is hidden until you nail it."
      level={level}
      testId="interval-trainer-container"
    >
      <MicGate>
        {/* interval selector */}
        <div data-testid="interval-checkbox-grid" className="glass rounded-2xl p-4 mb-5">
          <p className="text-[10px] font-mono uppercase text-slate-500 mb-3">Practice these intervals</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INTERVALS.map((iv) => (
              <label
                key={iv.id}
                data-testid={`interval-check-${iv.id}`}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer border transition-colors ${
                  selected.includes(iv.id) ? "border-teal-glow/40 bg-teal-glow/10" : "border-white/10 hover:border-white/20"
                }`}
              >
                <Checkbox checked={selected.includes(iv.id)} onCheckedChange={() => toggle(iv.id)} />
                <span className="text-sm">{iv.short}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="glass rounded-2xl px-5 py-2 text-center">
              <span className="text-xl font-bold font-mono text-teal-glow">{score}</span>
              <span className="text-[10px] uppercase font-mono text-slate-500 ml-2">solved</span>
            </div>
          </div>

          {!challenge ? (
            <div className="text-center">
              <Ear className="w-12 h-12 text-teal-glow mx-auto mb-4" />
              <p className="text-slate-400 mb-5">Select intervals above, then start your ear workout.</p>
              <Button
                data-testid="play-root-drone-button"
                onClick={start}
                disabled={!selected.length}
                className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12 px-6 disabled:opacity-40"
              >
                <Play className="w-4 h-4 mr-2" /> Begin
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-md flex flex-col items-center">
              <div data-testid="current-interval-prompt" className="text-center mb-5">
                <p className="text-sm text-slate-400 mb-1">
                  Root note played: <span className="font-mono text-indigo-300">{midiToName(challenge.root)}</span>
                </p>
                <p className="text-2xl font-bold">
                  Sing a <span className="text-teal-glow">{challenge.label}</span>{" "}
                  <span className="text-slate-300">{challenge.direction === "up" ? "above" : "below"}</span>
                </p>
              </div>

              <AnimatePresence>
                {reveal && (
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-emerald-400 mb-4"
                    data-testid="interval-reveal"
                  >
                    <div className="flex items-center gap-2 justify-center text-lg font-semibold">
                      <Check className="w-5 h-5" /> That was {midiToName(challenge.target)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full">
                <div className="h-2 rounded-full bg-black/40 overflow-hidden mb-3">
                  <div className="h-full bg-teal-glow transition-all duration-75" style={{ width: `${progress * 100}%` }} />
                </div>
                <TuningMeter cents={cents} active={detecting} tolerance={tolerance} testId="interval-cents-meter" />
                <p className="text-center text-sm text-slate-400 mt-2">
                  Singing: <span className="font-mono text-slate-200">{detecting ? sungNote : "—"}</span>
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                <Button onClick={() => engine.playMidi(challenge.root, 1.2)} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Replay Root
                </Button>
                <Button onClick={skip} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Skip
                </Button>
              </div>
            </div>
          )}
        </div>
      </MicGate>
    </ModuleShell>
  );
}
