import React, { useState, useCallback, useMemo } from "react";
import { Layers, Play, ArrowUp, ArrowDown, AlertTriangle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { midiToName, freqToMidiFloat, SAFE_LOW_MIDI, SAFE_HIGH_MIDI } from "@/lib/audio/notes";
import { levelConfig } from "@/lib/progression";
import { usePitchTarget } from "@/hooks/usePitchTarget";
import { useLivePitch } from "@/hooks/useLivePitch";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import TuningMeter from "@/components/TuningMeter";
import { Button } from "@/components/ui/button";

export default function Octaves() {
  const { engine, profile, micRunning, recordAttempt, getLevel } = useApp();
  const level = getLevel("octaves");
  const cfg = levelConfig(level);
  const lo = profile.rangeLow ?? SAFE_LOW_MIDI;
  const hi = profile.rangeHigh ?? 72;
  const rangeOk = hi - lo >= 12;

  const [direction, setDirection] = useState("up");
  const [round, setRound] = useState(null); // {ref, target}
  const [score, setScore] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);

  const pickRound = useCallback((dir) => {
    let refLo, refHi;
    if (dir === "up") {
      refLo = Math.max(lo, SAFE_LOW_MIDI);
      refHi = Math.min(hi - 12, SAFE_HIGH_MIDI);
    } else {
      refLo = Math.max(lo + 12, SAFE_LOW_MIDI);
      refHi = Math.min(hi, SAFE_HIGH_MIDI);
    }
    if (refHi < refLo) return null;
    const ref = refLo + Math.floor(Math.random() * (refHi - refLo + 1));
    const target = dir === "up" ? ref + 12 : ref - 12;
    return { ref, target };
  }, [lo, hi]);

  const start = (dir = direction) => {
    const r = pickRound(dir);
    if (r) {
      setRound(r);
      setTimeout(() => engine.playMidi(r.ref, 1.0), 200);
    }
  };

  const onHit = useCallback((cents) => {
    setScore((s) => s + 1);
    recordAttempt({ module: "octaves", targetMidi: round.target, cents, correct: true });
    setHitFlash(true);
    setTimeout(() => {
      setHitFlash(false);
      start();
    }, 1100);
  }, [round, recordAttempt]);

  const { progress, cents, detecting, sungNote } = usePitchTarget({
    active: micRunning && !!round && !hitFlash,
    targetMidi: round?.target ?? null,
    tolerance: cfg.tolerance,
    holdTime: cfg.hold,
    allowOctave: false,
    onHit,
  });

  const { pitch } = useLivePitch(micRunning);

  if (!rangeOk) {
    return (
      <ModuleShell icon={Layers} title="Octave Trainer" testId="octave-trainer-container"
        subtitle="Sing a reference note one octave higher or lower — from memory.">
        <div data-testid="range-too-narrow" className="glass rounded-3xl p-8 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-tune-flat" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Your range needs a little more room</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Octave training needs at least 12 semitones of vocal range. Yours is currently{" "}
            <span className="font-mono text-slate-200">
              {midiToName(lo)}–{midiToName(hi)}
            </span>{" "}
            ({hi - lo} semitones). Warm up with Pitch Lab and Note Match, then re-run the range
            test to expand it.
          </p>
        </div>
      </ModuleShell>
    );
  }

  // pitch ladder rungs (an octave span around ref & target)
  const ladderLo = round ? Math.min(round.ref, round.target) : lo;
  const ladderHi = round ? Math.max(round.ref, round.target) : hi;
  const liveMidi = pitch.freq > 0 ? freqToMidiFloat(pitch.freq) : null;
  const livePct = liveMidi != null ? ((liveMidi - ladderLo) / (ladderHi - ladderLo)) * 100 : null;

  return (
    <ModuleShell
      icon={Layers}
      title="Octave Trainer"
      subtitle="Hear a reference note, then sing it exactly one octave away — no target is played."
      level={level}
      testId="octave-trainer-container"
    >
      <MicGate>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="glass rounded-2xl px-5 py-3 text-center">
            <div className="text-2xl font-bold font-mono text-teal-glow">{score}</div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Nailed</div>
          </div>
          <div data-testid="octave-direction-toggle" className="glass rounded-2xl p-1 flex">
            {["up", "down"].map((d) => (
              <button
                key={d}
                onClick={() => { setDirection(d); setRound(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  direction === d ? "bg-teal-glow/20 text-teal-glow" : "text-slate-400"
                }`}
              >
                {d === "up" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {d === "up" ? "Higher" : "Lower"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_120px] gap-4">
          <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center">
            {!round ? (
              <div className="text-center">
                <p className="text-slate-400 mb-5">Ready to test your pitch memory?</p>
                <Button
                  data-testid="octave-play-ref-button"
                  onClick={() => start()}
                  className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12 px-6"
                >
                  <Play className="w-4 h-4 mr-2" /> Play Reference
                </Button>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {hitFlash ? (
                    <motion.div key="hit" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-emerald-400 mb-4">
                      <div className="text-5xl">✓</div>
                      <div className="font-semibold mt-1">Spot on!</div>
                    </motion.div>
                  ) : (
                    <div key="prompt" className="text-center mb-4" data-testid="octave-prompt">
                      <p className="text-sm text-slate-400 mb-1">
                        Reference was <span className="font-mono text-indigo-300 text-lg">{midiToName(round.ref)}</span>
                      </p>
                      <p className="text-lg font-semibold">
                        Sing one octave <span className="text-teal-glow">{direction === "up" ? "higher" : "lower"}</span>
                      </p>
                    </div>
                  )}
                </AnimatePresence>

                <div className="w-full max-w-sm">
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden mb-3">
                    <div className="h-full bg-teal-glow transition-all duration-75" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <TuningMeter cents={cents} active={detecting} tolerance={cfg.tolerance} testId="octave-cents-meter" />
                  <p className="text-center text-sm text-slate-400 mt-2">
                    Singing: <span className="font-mono text-slate-200">{detecting ? sungNote : "—"}</span>
                  </p>
                </div>

                <Button data-testid="octave-replay-ref" onClick={() => engine.playMidi(round.ref, 1.0)} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5 mt-5">
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Replay Reference
                </Button>
              </>
            )}
          </div>

          {/* pitch ladder */}
          <div data-testid="octave-pitch-ladder" className="glass rounded-3xl p-3 relative flex flex-col justify-between min-h-[260px]">
            {round && (
              <>
                <div className="absolute inset-x-3 flex flex-col justify-between h-[calc(100%-24px)] top-3 pointer-events-none">
                  {Array.from({ length: ladderHi - ladderLo + 1 }).map((_, i) => {
                    const m = ladderHi - i;
                    const isRef = m === round.ref;
                    const isTgt = m === round.target;
                    return (
                      <div key={m} className="flex items-center gap-2">
                        <div className={`h-px flex-1 ${isRef ? "bg-indigo-400" : isTgt ? "bg-teal-glow" : "bg-white/8"}`} />
                        <span className={`font-mono text-[9px] w-8 ${isRef ? "text-indigo-300" : isTgt ? "text-teal-glow" : "text-slate-600"}`}>
                          {midiToName(m)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {livePct != null && livePct >= -5 && livePct <= 105 && (
                  <div
                    className="absolute left-1 right-10 h-1.5 rounded-full bg-rose-400 shadow-[0_0_10px_#f43f5e] transition-all duration-75"
                    style={{ bottom: `calc(${Math.max(0, Math.min(100, livePct))}% + 12px)` }}
                  />
                )}
              </>
            )}
            {!round && <div className="text-center text-slate-600 text-xs m-auto">Pitch ladder</div>}
          </div>
        </div>

        {round && (
          <div className="flex justify-center mt-4">
            <Button onClick={() => start()} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
              <RotateCcw className="w-4 h-4 mr-2" /> New Note
            </Button>
          </div>
        )}
      </MicGate>
    </ModuleShell>
  );
}
