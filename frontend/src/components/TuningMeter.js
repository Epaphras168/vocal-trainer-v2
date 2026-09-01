import React from "react";

// Color-coded cents deviation meter, -50..+50. green in tune, amber flat, rose sharp.
export function tuneColor(cents, tolerance = 20) {
  if (cents == null || !isFinite(cents)) return "#64748b";
  if (Math.abs(cents) <= tolerance) return "#10b981";
  return cents < 0 ? "#f59e0b" : "#f43f5e";
}

export default function TuningMeter({ cents, active, tolerance = 20, testId = "tuning-meter" }) {
  const clamped = Math.max(-50, Math.min(50, cents || 0));
  const pct = ((clamped + 50) / 100) * 100;
  const color = active ? tuneColor(cents, tolerance) : "#334155";
  const inTune = active && Math.abs(cents || 0) <= tolerance;

  return (
    <div data-testid={testId} className="w-full">
      <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1.5 px-0.5">
        <span>♭ Flat</span>
        <span className="text-slate-400">In Tune</span>
        <span>Sharp ♯</span>
      </div>
      <div className="relative h-4 rounded-full bg-black/40 overflow-hidden border border-white/5">
        {/* tolerance zone */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/15"
          style={{
            left: `${((-tolerance + 50) / 100) * 100}%`,
            right: `${((-tolerance + 50) / 100) * 100}%`,
          }}
        />
        {/* center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-400/50" />
        {/* needle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-6 rounded-full transition-all duration-100"
          style={{
            left: `${pct}%`,
            backgroundColor: color,
            boxShadow: active ? `0 0 12px ${color}` : "none",
            opacity: active ? 1 : 0.4,
          }}
        />
      </div>
      <div className="text-center mt-2 font-mono text-sm" style={{ color }}>
        {active && isFinite(cents) ? `${cents > 0 ? "+" : ""}${Math.round(cents)}¢` : "—"}
        {inTune && <span className="ml-2 text-emerald-400">✓ in tune</span>}
      </div>
    </div>
  );
}
