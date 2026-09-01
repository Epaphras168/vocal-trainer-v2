import React, { useState, useCallback, useMemo } from "react";
import { Activity, Play, RotateCcw, MicOff, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { midiToName, SCALES, SAFE_LOW_MIDI, SAFE_HIGH_MIDI } from "@/lib/audio/notes";
import { levelConfig } from "@/lib/progression";
import { usePitchTarget } from "@/hooks/usePitchTarget";
import ModuleShell from "@/components/ModuleShell";
import MicGate from "@/components/MicGate";
import TuningMeter from "@/components/TuningMeter";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Scales() {
  const { engine, profile, micRunning, recordAttempt, getLevel } = useApp();
  const level = getLevel("scales");
  const cfg = levelConfig(level);

  const rootOptions = useMemo(() => {
    const lo = Math.max(SAFE_LOW_MIDI, profile.rangeLow ?? SAFE_LOW_MIDI);
    const hi = Math.min(SAFE_HIGH_MIDI - 12, (profile.rangeHigh ?? 72) - 12);
    const arr = [];
    for (let m = lo; m <= Math.max(lo, hi); m++) arr.push(m);
    return arr.length ? arr : [60];
  }, [profile.rangeLow, profile.rangeHigh]);

  const [root, setRoot] = useState(rootOptions[Math.floor(rootOptions.length / 3)] || 60);
  const [scaleType, setScaleType] = useState("major");
  const [current, setCurrent] = useState(-1); // -1 = not started
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [done, setDone] = useState([]);

  const notes = useMemo(
    () => SCALES[scaleType].steps.map((s) => root + s),
    [root, scaleType]
  );

  const practicing = current >= 0 && current < notes.length;

  const advance = useCallback((cents) => {
    recordAttempt({ module: "scales", targetMidi: notes[current], cents, correct: true });
    setDone((d) => [...d, current]);
    if (current + 1 < notes.length) {
      setCurrent((c) => c + 1);
    } else {
      setCurrent(notes.length); // complete
    }
  }, [current, notes, recordAttempt]);

  const { progress, cents, inTune, detecting, reset } = usePitchTarget({
    active: micRunning && practicing && playingIdx < 0,
    targetMidi: practicing ? notes[current] : null,
    tolerance: cfg.tolerance,
    holdTime: cfg.hold,
    allowOctave: false,
    onHit: advance,
  });

  const playScale = async () => {
    setPlayingIdx(0);
    await engine.playSequence(notes, 0.5, 0.06, (i) => setPlayingIdx(i));
    setPlayingIdx(-1);
  };

  const start = () => {
    setDone([]);
    setCurrent(0);
    reset();
  };

  const resetAll = () => {
    setCurrent(-1);
    setDone([]);
    setPlayingIdx(-1);
    reset();
  };

  const complete = current === notes.length;

  return (
    <ModuleShell
      icon={Activity}
      title="Scales Trainer"
      subtitle="Pick a root and scale, hear it played, then sing each note in tune to advance."
      level={level}
      testId="scales-trainer-container"
    >
      <MicGate>
        {/* controls */}
        <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center mb-5">
          <div className="flex-1 min-w-[130px]">
            <label className="text-[10px] font-mono uppercase text-slate-500">Root</label>
            <Select value={String(root)} onValueChange={(v) => { setRoot(Number(v)); resetAll(); }}>
              <SelectTrigger data-testid="scale-select-root" className="mt-1 bg-black/30 border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {rootOptions.map((m) => (
                  <SelectItem key={m} value={String(m)}>{midiToName(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-mono uppercase text-slate-500">Scale</label>
            <Select value={scaleType} onValueChange={(v) => { setScaleType(v); resetAll(); }}>
              <SelectTrigger data-testid="scale-select-type" className="mt-1 bg-black/30 border-white/10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCALES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* note bubbles */}
        <div data-testid="scale-step-beads" className="glass rounded-3xl p-6 mb-5">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {notes.map((m, i) => {
              const isDone = done.includes(i);
              const isCurrent = i === current && practicing;
              const isPlaying = i === playingIdx;
              return (
                <motion.div
                  key={i}
                  animate={isCurrent || isPlaying ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ repeat: isCurrent || isPlaying ? Infinity : 0, duration: 1.1 }}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono text-sm border transition-colors ${
                    isDone
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                      : isCurrent
                      ? "bg-teal-glow/20 border-teal-glow text-teal-glow"
                      : isPlaying
                      ? "bg-indigo-500/25 border-indigo-400 text-indigo-200"
                      : "bg-white/5 border-white/10 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : <span>{midiToName(m)}</span>}
                </motion.div>
              );
            })}
          </div>

          {complete ? (
            <div className="text-center py-4" data-testid="scale-complete">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-semibold text-emerald-300 mb-4">Scale complete — beautifully sung!</p>
              <Button onClick={start} className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold">
                <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
              </Button>
            </div>
          ) : practicing ? (
            <div className="max-w-sm mx-auto">
              <p className="text-center text-sm text-slate-400 mb-3">
                Sing <span className="font-mono text-teal-glow text-lg">{midiToName(notes[current])}</span> and hold it
              </p>
              <div className="h-2 rounded-full bg-black/40 overflow-hidden mb-4">
                <div className="h-full bg-teal-glow transition-all duration-75" style={{ width: `${progress * 100}%` }} />
              </div>
              <TuningMeter cents={cents} active={detecting} tolerance={cfg.tolerance} testId="scale-cents-meter" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                data-testid="scale-playback-toggle"
                onClick={playScale}
                disabled={playingIdx >= 0}
                variant="outline"
                className="rounded-full border-white/20 bg-transparent hover:bg-white/5"
              >
                <Play className="w-4 h-4 mr-2" /> Hear Scale
              </Button>
              <Button
                data-testid="start-scale-button"
                onClick={start}
                className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold"
              >
                Start Singing
              </Button>
            </div>
          )}
        </div>

        {practicing && (
          <div className="flex justify-center">
            <Button onClick={resetAll} variant="outline" size="sm" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
              <RotateCcw className="w-4 h-4 mr-2" /> Restart
            </Button>
          </div>
        )}
      </MicGate>
    </ModuleShell>
  );
}
