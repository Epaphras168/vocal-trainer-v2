import React, { useState, useEffect, useRef } from "react";
import { Wind, Play, Pause, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import ModuleShell from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";

const PRESETS = {
  box: {
    label: "Box Breathing",
    tag: "4-4-4-4",
    desc: "Calm & focus",
    phases: [
      { label: "Inhale", dur: 4, scale: 1 },
      { label: "Hold", dur: 4, scale: 1 },
      { label: "Exhale", dur: 4, scale: 0.42 },
      { label: "Hold", dur: 4, scale: 0.42 },
    ],
  },
  deep: {
    label: "Deep Warmup",
    tag: "4-2-6",
    desc: "Pre-singing prep",
    phases: [
      { label: "Inhale", dur: 4, scale: 1 },
      { label: "Hold", dur: 2, scale: 1 },
      { label: "Exhale", dur: 6, scale: 0.42 },
    ],
  },
  relax: {
    label: "Relaxing",
    tag: "4-0-8",
    desc: "Wind down",
    phases: [
      { label: "Inhale", dur: 4, scale: 1 },
      { label: "Exhale", dur: 8, scale: 0.42 },
    ],
  },
  p478: {
    label: "4-7-8 Pranayama",
    tag: "4-7-8",
    desc: "Deep relaxation",
    phases: [
      { label: "Inhale", dur: 4, scale: 1 },
      { label: "Hold", dur: 7, scale: 1 },
      { label: "Exhale", dur: 8, scale: 0.42 },
    ],
  },
};

const PHASE_COLOR = { Inhale: "#2dd4bf", Hold: "#6366f1", Exhale: "#06b6d4" };

export default function Breathing() {
  const [presetKey, setPresetKey] = useState("box");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [rounds, setRounds] = useState(0);
  const raf = useRef(null);
  const phaseStart = useRef(0);
  const state = useRef({ phaseIdx: 0 });

  const preset = PRESETS[presetKey];
  const phase = preset.phases[phaseIdx];

  useEffect(() => {
    if (!running) return;
    phaseStart.current = performance.now();
    const tick = () => {
      const p = PRESETS[presetKey].phases[state.current.phaseIdx];
      const elapsed = (performance.now() - phaseStart.current) / 1000;
      const left = Math.max(0, p.dur - elapsed);
      setRemaining(left);
      if (left <= 0) {
        let next = state.current.phaseIdx + 1;
        if (next >= PRESETS[presetKey].phases.length) {
          next = 0;
          setRounds((r) => r + 1);
        }
        state.current.phaseIdx = next;
        setPhaseIdx(next);
        phaseStart.current = performance.now();
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running, presetKey]);

  const startStop = () => {
    if (running) {
      setRunning(false);
      cancelAnimationFrame(raf.current);
    } else {
      state.current.phaseIdx = 0;
      setPhaseIdx(0);
      setRemaining(preset.phases[0].dur);
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    cancelAnimationFrame(raf.current);
    state.current.phaseIdx = 0;
    setPhaseIdx(0);
    setRounds(0);
    setRemaining(0);
  };

  const changePreset = (k) => {
    reset();
    setPresetKey(k);
  };

  const color = PHASE_COLOR[phase.label] || "#2dd4bf";

  return (
    <ModuleShell
      icon={Wind}
      title="Breathing Exercises"
      subtitle="Steady your breath and support your voice. Follow the orb — expand as you inhale, settle as you exhale."
      testId="breathing-container"
    >
      {/* presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(PRESETS).map(([k, p]) => (
          <button
            key={k}
            data-testid={`breath-preset-${k}`}
            onClick={() => changePreset(k)}
            className={`rounded-2xl p-4 text-left border transition-all ${
              presetKey === k ? "border-teal-glow bg-teal-glow/10" : "border-white/10 hover:border-white/25"
            }`}
          >
            <div className="font-semibold text-sm">{p.label}</div>
            <div className="font-mono text-xs text-teal-glow mt-0.5">{p.tag}</div>
            <div className="text-[11px] text-slate-500 mt-1">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* breathing orb */}
      <div className="glass rounded-3xl p-8 flex flex-col items-center">
        <div className="relative w-72 h-72 flex items-center justify-center mb-6">
          {/* outer guide ring */}
          <div className="absolute w-full h-full rounded-full border border-white/5" />
          <motion.div
            data-testid="breath-circle-orb"
            className="rounded-full flex items-center justify-center"
            animate={{ scale: running ? phase.scale : 0.6 }}
            transition={{ duration: running ? phase.dur : 0.6, ease: "easeInOut" }}
            style={{
              width: 260,
              height: 260,
              background: `radial-gradient(circle at 50% 40%, ${color}55, ${color}18 60%, transparent 75%)`,
              boxShadow: `0 0 60px ${color}44`,
            }}
          >
            <div className="text-center">
              <div data-testid="breath-phase-text" className="text-2xl font-semibold" style={{ color }}>
                {running ? phase.label : "Ready"}
              </div>
              <div data-testid="breath-countdown-timer" className="font-mono text-5xl font-bold mt-1">
                {running ? Math.ceil(remaining) : "—"}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="text-center" data-testid="breath-cycle-counter">
            <div className="text-2xl font-bold font-mono text-teal-glow">{rounds}</div>
            <div className="text-[10px] uppercase font-mono text-slate-500">Rounds</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex gap-1.5">
            {preset.phases.map((p, i) => (
              <div
                key={i}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                  running && i === phaseIdx ? "bg-teal-glow/25 text-teal-glow" : "bg-white/5 text-slate-500"
                }`}
              >
                {p.label} {p.dur}s
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            data-testid="breath-start-stop-button"
            onClick={startStop}
            className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold px-6"
          >
            {running ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Start</>}
          </Button>
          <Button onClick={reset} variant="outline" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </div>
    </ModuleShell>
  );
}
