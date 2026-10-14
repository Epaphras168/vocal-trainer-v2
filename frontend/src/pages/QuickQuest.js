import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Flame, Headphones, Play, RotateCcw, Sparkles, Timer, Trophy } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { midiToName, midiToFreq, SAFE_HIGH_MIDI, SAFE_LOW_MIDI } from "@/lib/audio/notes";
import { levelConfig, adaptTolerance } from "@/lib/progression";
import { usePitchTarget } from "@/hooks/usePitchTarget";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import TuningMeter from "@/components/TuningMeter";
import { Button } from "@/components/ui/button";

const TOTAL_ROUNDS = 8;
const ROUND_SECONDS = 60;

function pickTarget(lo, hi, previous) {
  let next = previous;
  for (let i = 0; i < 20 && next === previous; i += 1) {
    next = lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  return next;
}

export default function QuickQuest() {
  const navigate = useNavigate();
  const { engine, profile, micRunning, recordAttempt, endSession, getLevel } = useApp();
  const level = getLevel("match");
  const cfg = levelConfig(level);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [recentResult, setRecentResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);

  const [lo, hi] = useMemo(() => {
    const low = Math.max(SAFE_LOW_MIDI, profile.rangeLow ?? SAFE_LOW_MIDI);
    const high = Math.min(SAFE_HIGH_MIDI, profile.rangeHigh ?? 72);
    return high - low >= 4 ? [low, high] : [SAFE_LOW_MIDI, 72];
  }, [profile.rangeLow, profile.rangeHigh]);
  const tolerance = adaptTolerance(cfg.tolerance, recent);

  const finish = useCallback(() => {
    setRunning(false);
    setTarget(null);
    const saved = endSession();
    setSummary({ score, rounds: round, accuracy: saved?.accuracy ?? (round ? score / (round * 100) : 0) });
  }, [endSession, round, score]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          finish();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, finish]);

  const playTarget = useCallback((midi = target) => {
    if (midi != null) engine.playMidi(midi, 0.85);
  }, [engine, target]);

  const begin = useCallback(() => {
    const first = pickTarget(lo, hi, null);
    setSeconds(ROUND_SECONDS);
    setRound(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setRecent([]);
    setRecentResult(null);
    setSummary(null);
    setTarget(first);
    setRunning(true);
    window.setTimeout(() => playTarget(first), 180);
  }, [hi, lo, playTarget]);

  const onHit = useCallback((cents) => {
    const nextRound = round + 1;
    const nextCombo = combo + 1;
    const points = 100 + Math.min(combo, 4) * 25;
    const nextScore = score + points;
    recordAttempt({ module: "match", targetMidi: target, cents, correct: true });
    setRecent((items) => [...items, true].slice(-12));
    setRecentResult({ points, note: midiToName(target) });
    setRound(nextRound);
    setScore(nextScore);
    setCombo(nextCombo);
    setBestCombo((best) => Math.max(best, nextCombo));
    if (nextRound >= TOTAL_ROUNDS) {
      setRunning(false);
      setTarget(null);
      const saved = endSession();
      setSummary({ score: nextScore, rounds: nextRound, accuracy: saved?.accuracy ?? 1 });
      return;
    }
    const nextTarget = pickTarget(lo, hi, target);
    setTarget(nextTarget);
    window.setTimeout(() => playTarget(nextTarget), 450);
  }, [combo, endSession, hi, lo, playTarget, recordAttempt, round, score, target]);

  const { progress, cents, inTune, detecting, sungNote } = usePitchTarget({
    active: micRunning && running && target != null,
    targetMidi: target,
    tolerance,
    holdTime: Math.max(0.75, cfg.hold - 0.15),
    allowOctave: true,
    onHit,
  });

  const skip = () => {
    if (target == null) return;
    recordAttempt({ module: "match", targetMidi: target, cents: null, correct: false });
    setRecent((items) => [...items, false].slice(-12));
    setCombo(0);
    setRecentResult({ points: 0, note: midiToName(target), skipped: true });
    const nextTarget = pickTarget(lo, hi, target);
    setRound((value) => value + 1);
    setTarget(nextTarget);
    window.setTimeout(() => playTarget(nextTarget), 250);
  };

  return (
    <ModuleShell
      icon={Sparkles}
      title="Quick Quest"
      subtitle="Eight notes. One minute. Find the note, hold the moment, build your combo."
      level={level}
      testId="quick-quest-container"
      right={<Button onClick={() => navigate("/")} variant="ghost" size="sm" className="text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4 mr-1.5" /> Home</Button>}
    >
      <MicGate>
        {!running && !summary && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-7 sm:p-10 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-teal-glow/15 border border-teal-glow/30 flex items-center justify-center mx-auto mb-5"><Trophy className="w-8 h-8 text-teal-glow" /></div>
            <p className="text-xs uppercase tracking-widest font-mono text-teal-glow mb-2">Your daily mini-challenge</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Make your voice count.</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto mb-7">Listen to each target, sing it back, and keep your streak alive. Every note is chosen inside your saved range.</p>
            <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-400 mb-7"><span className="rounded-full bg-white/5 px-3 py-1.5">8 target notes</span><span className="rounded-full bg-white/5 px-3 py-1.5">60 seconds</span><span className="rounded-full bg-white/5 px-3 py-1.5">Combo scoring</span></div>
            <Button data-testid="start-quick-quest" onClick={begin} className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold h-12 px-7"><Play className="w-4 h-4 mr-2" /> Start Quest</Button>
          </motion.div>
        )}

        {running && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="glass rounded-2xl px-3 py-3 text-center"><div className="font-mono text-xl font-bold text-teal-glow">{round}/{TOTAL_ROUNDS}</div><div className="text-[10px] uppercase text-slate-500">Notes</div></div>
              <div className="glass rounded-2xl px-3 py-3 text-center"><div className="font-mono text-xl font-bold text-amber-300 flex justify-center items-center gap-1"><Flame className="w-4 h-4" />{combo}</div><div className="text-[10px] uppercase text-slate-500">Combo</div></div>
              <div className="glass rounded-2xl px-3 py-3 text-center"><div className="font-mono text-xl font-bold text-slate-100 flex justify-center items-center gap-1"><Timer className="w-4 h-4" />{seconds}s</div><div className="text-[10px] uppercase text-slate-500">Time</div></div>
            </div>
            <div className="h-2 rounded-full bg-black/35 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-teal-glow to-indigo-400" animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }} /></div>
            <div className="glass rounded-3xl p-7 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-teal-glow/10 blur-3xl" />
              <div className="relative">
                <p className="text-xs uppercase tracking-widest font-mono text-slate-500 mb-4">Sing this note</p>
                <AnimatePresence mode="wait"><motion.div key={target} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`text-7xl sm:text-8xl font-bold font-mono ${inTune ? "text-emerald-300 text-glow-teal" : "text-white"}`}>{target != null ? midiToName(target) : "—"}</motion.div></AnimatePresence>
                <p className="font-mono text-xs text-slate-500 mt-2">{target != null ? `${midiToFreq(target).toFixed(1)} Hz` : ""}</p>
                <Button data-testid="quick-quest-replay" onClick={() => playTarget()} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5 mt-5"><Headphones className="w-3.5 h-3.5 mr-1.5" /> Replay target</Button>
                <div className="max-w-sm mx-auto mt-7"><div className="h-3 rounded-full bg-black/40 overflow-hidden mb-4"><motion.div className="h-full bg-emerald-400" animate={{ width: `${progress * 100}%` }} /></div><TuningMeter cents={cents} active={detecting} tolerance={tolerance} testId="quick-quest-cents-meter" /><p className="text-sm text-slate-400 mt-3">{detecting ? <>You're singing <span className="font-mono text-slate-100">{sungNote}</span></> : "Sing when you're ready…"}</p></div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3"><div className="text-sm text-slate-400 min-h-5">{recentResult && <span className={recentResult.skipped ? "text-slate-400" : "text-emerald-300"}>{recentResult.skipped ? "Skipped — reset your combo" : `+${recentResult.points} · ${recentResult.note} locked in`}</span>}</div><Button onClick={skip} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">Skip note</Button></div>
          </div>
        )}

        {summary && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-8 sm:p-10 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/15 flex items-center justify-center mx-auto mb-5"><Trophy className="w-8 h-8 text-amber-300" /></div>
            <p className="text-xs uppercase tracking-widest font-mono text-amber-300 mb-2">Quest complete</p>
            <h2 className="text-3xl font-bold mb-2">You showed up. That counts.</h2>
            <p className="text-slate-400 text-sm mb-7">{summary.rounds >= TOTAL_ROUNDS ? "Full clear — your pitch is getting steadier." : "Nice work — try again and see if you can add one more note."}</p>
            <div className="grid grid-cols-3 gap-2 mb-7"><div className="bg-black/20 rounded-2xl p-3"><div className="font-mono text-xl text-teal-glow">{summary.score}</div><div className="text-[10px] uppercase text-slate-500">Points</div></div><div className="bg-black/20 rounded-2xl p-3"><div className="font-mono text-xl text-emerald-300">{summary.rounds}/{TOTAL_ROUNDS}</div><div className="text-[10px] uppercase text-slate-500">Notes</div></div><div className="bg-black/20 rounded-2xl p-3"><div className="font-mono text-xl text-amber-300">{bestCombo}</div><div className="text-[10px] uppercase text-slate-500">Best combo</div></div></div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center"><Button data-testid="retry-quick-quest" onClick={begin} className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold"><RotateCcw className="w-4 h-4 mr-2" /> Run it again</Button><Button onClick={() => navigate("/")} variant="outline" className="rounded-full border-white/20 bg-transparent hover:bg-white/5"><Check className="w-4 h-4 mr-2" /> Back to home</Button></div>
          </motion.div>
        )}
      </MicGate>
    </ModuleShell>
  );
}
