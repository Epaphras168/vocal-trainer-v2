import React from "react";

export default function VolumeMeter({ volume, active, testId = "volume-meter" }) {
  const pct = active ? Math.min(100, (volume || 0) * 100) : 0;
  const bars = 20;
  const lit = Math.round((pct / 100) * bars);
  return (
    <div data-testid={testId} className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-500 uppercase">Vol</span>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: bars }).map((_, i) => {
          const on = i < lit;
          const color =
            i < bars * 0.6 ? "#10b981" : i < bars * 0.85 ? "#f59e0b" : "#f43f5e";
          return (
            <div
              key={i}
              className="flex-1 h-4 rounded-sm transition-all duration-75"
              style={{
                backgroundColor: on ? color : "rgba(148,163,184,0.12)",
                boxShadow: on ? `0 0 6px ${color}88` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
