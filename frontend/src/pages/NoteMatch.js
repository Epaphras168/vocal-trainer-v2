import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Target, Play, SkipForward, MicOff, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { midiToName, midiToFreq, SAFE_LOW_MIDI, SAFE_HIGH_MIDI } from "@/lib/audio/notes";
import { levelConfig, adaptTolerance } from "@/lib/progression";
import { usePitchTarget } from "@/hooks/usePitchTarget";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import TuningMeter from "@/components/TuningMeter";
import SessionSummaryDialog from "@/components/SessionSummaryDialog";
import { Button } from "@/components/ui/button";

function useTargetRange(profile) {
  return useMemo(() => {
    const lo = Math.max(SAFE_LOW_MIDI, profile.rangeLow ?? SAFE_LOW_MIDI);
    const hi = Math.min(SAFE_HIGH_MIDI, profile.rangeHigh ?? 72);
    return hi - lo >= 4 ? [lo, hi] : [SAFE_LOW_MIDI, 72];
  }, [profile.rangeLow, profile.rangeHigh]);
}

export default function NoteMatch() {
  const { engine, profile, micRunning, stopMic, recordAttempt, endSession, getLevel } = useApp();
  const level = getLevel("match");
  const cfg = levelConfig(level);
  const [lo, hi] = useTargetRange(profile);
  const [target, setTarget] = useState(() => Math.round((lo + hi) / 2));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState([]);
  const [hitFlash, setHitFlash] = useState(false);
  const [summary, setSummary] = useState(null);

  const tolerance = adaptTolerance(cfg.tolerance, recent);

  const nextTarget = useCallback(() => {
    let t = target;
    let tries = 0;
    while (t === target && tries < 20) {
      t = lo + Math.floor(Math.random() * (hi - lo + 1));
      tries++;
    }
    setTarget(t);
    return t;
  }, [target, lo, hi]);

  const playTarget = useCallback((m = target) => {
    engine.playMidi(m, 0.9);
  }, [engine, target]);

  const onHit = useCallback((cents) => {
    setScore((s) => s + 1);
    setStreak((s) => s + 1);
    setRecent((r) => [...r, true].slice(-12));
    recordAttempt({ module: "match", targetMidi: target, cents, correct: true });
    setHitFlash(true);
    setTimeout(() => {
      setHitFlash(false);
      const t = nextTarget();
      setTimeout(() => playTarget(t), 350);
    }, 900);
  }, [target, recordAttempt, nextTarget, playTarget]);

  const { progress, cents, inTune, detecting, sungNote, reset } = usePitchTarget({
    active: micRunning && !hitFlash,
    targetMidi: target,
    tolerance,
    holdTime: cfg.hold,
    allowOctave: true,
    onHit,
  });

  const skip = () => {
    setStreak(0);
    setRecent((r) => [...r, false].slice(-12));
    recordAttempt({ module: "match", targetMidi: target, cents: null, correct: false });
    reset();
    const t = nextTarget();
    setTimeout(() => playTarget(t), 300);
  };

  const finish = () => {
    const s = endSession();
    if (s) setSummary(s);
  };

  // ring geometry
  const R = 88;
  const C = 2 * Math.PI * R;

  return (
    <ModuleShell
      icon={Target}
      title="Note Match"
      subtitle="Listen to the target note, then sing it back. Hold it in tune to score."
      level={level}
      testId="note-match-container"
      right={
        micRunning && (
          <Button data-testid="finish-session-btn" onClick={finish} variant="outline" size="sm"
            className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
            <Flag className="w-4 h-4 mr-1.5" /> End
          </Button>
        )
      }
    >
      <MicGate>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div data-testid="match-score-badge" className="glass rounded-2xl px-5 py-3 text-center">
            <div className="text-2xl font-bold font-mono text-teal-glow">{score}</div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Score</div>
          </div>
          <div className="glass rounded-2xl px-5 py-3 text-center">
            <div className="text-2xl font-bold font-mono text-amber-300">{streak}🔥</div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Streak</div>
          </div>
          <div className="glass rounded-2xl px-5 py-3 text-center">
            <div className="text-2xl font-bold font-mono text-slate-200">±{Math.round(tolerance)}¢</div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Tolerance</div>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 flex flex-col items-center">
          {/* target + hold ring */}
          <div className="relative w-[220px] h-[220px] flex items-center justify-center mb-6">
            <svg className="absolute inset-0 -rotate-90" width="220" height="220">
              <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle
                cx="110" cy="110" r={R} fill="none"
                stroke={inTune ? "#10b981" : "#2dd4bf"}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: "stroke-dashoffset 0.06s linear", filter: `drop-shadow(0 0 8px ${inTune ? "#10b981" : "#2dd4bf"})` }}
              />
            </svg>
            <AnimatePresence>
              {hitFlash ? (
                <motion.div
                  key="hit"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-400 text-center"
                >
                  <div className="text-5xl">✓</div>
                  <div className="font-semibold mt-1">Perfect!</div>
                </motion.div>
              ) : (
                <div key="target" className="text-center" data-testid="target-note-display">
                  <div className="text-xs font-mono uppercase text-slate-500 mb-1">Target</div>
                  <div className="text-6xl font-bold font-mono text-white">{midiToName(target)}</div>
                  <div className="text-slate-500 font-mono text-xs mt-1">{midiToFreq(target).toFixed(1)} Hz</div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <Button
            data-testid="play-target-button"
            onClick={() => playTarget()}
            className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold mb-6"
          >
            <Play className="w-4 h-4 mr-2" /> Play Target
          </Button>

          <div className="w-full max-w-sm mb-2">
            <TuningMeter cents={cents} active={detecting} tolerance={tolerance} testId="cents-deviation-gauge" />
          </div>
          <div className="text-sm text-slate-400" data-testid="hold-timer-progress">
            You're singing: <span className="font-mono text-slate-200">{detecting ? sungNote : "—"}</span>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            data-testid="next-note-button"
            onClick={skip}
            variant="outline"
            className="rounded-full border-white/20 bg-transparent hover:bg-white/5"
          >
            <SkipForward className="w-4 h-4 mr-2" /> Skip
          </Button>
        </div>
      </MicGate>

      <SessionSummaryDialog summary={summary} open={!!summary} onClose={() => setSummary(null)} />
    </ModuleShell>
  );
}
