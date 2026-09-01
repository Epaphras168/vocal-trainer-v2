import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function DeltaRow({ label, value, delta, unit, invert }) {
  let Icon = Minus;
  let color = "text-slate-400";
  if (delta != null && Math.abs(delta) > 0.001) {
    const positive = invert ? delta < 0 : delta > 0;
    Icon = positive ? TrendingUp : TrendingDown;
    color = positive ? "text-emerald-400" : "text-rose-400";
  }
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-semibold">{value}{unit}</span>
        {delta != null && (
          <span className={`flex items-center gap-1 text-xs font-mono ${color}`}>
            <Icon className="w-3 h-3" />
            {delta > 0 ? "+" : ""}{typeof delta === "number" ? delta.toFixed(unit === "¢" ? 0 : 1) : delta}{unit === "%" ? "%" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SessionSummaryDialog({ summary, open, onClose }) {
  return (
    <AnimatePresence>
      {open && summary && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="session-summary-dialog"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="glass-strong rounded-3xl p-7 w-full max-w-md relative"
          >
            <button
              onClick={onClose}
              data-testid="close-summary-button"
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-400/15 flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-amber-300" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Session complete</h2>
            <p className="text-slate-400 text-sm mb-5">Nice work — here's how you did.</p>

            <div className="bg-black/20 rounded-2xl px-4">
              <DeltaRow
                label="Accuracy"
                value={Math.round(summary.accuracy * 100)}
                unit="%"
                delta={summary.deltaAccuracy != null ? Math.round(summary.deltaAccuracy * 100) : null}
              />
              <DeltaRow label="Notes hit" value={`${summary.hits}/${summary.total}`} />
              <DeltaRow
                label="Avg deviation"
                value={Math.round(summary.avgCents)}
                unit="¢"
                delta={summary.deltaCents != null ? Math.round(summary.deltaCents) : null}
                invert
              />
            </div>

            <Button
              onClick={onClose}
              data-testid="summary-continue-button"
              className="w-full mt-6 rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
