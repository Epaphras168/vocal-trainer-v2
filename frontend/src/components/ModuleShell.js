import React from "react";
import { motion } from "framer-motion";
import { levelConfig } from "@/lib/progression";

// Page shell with a consistent header, optional level badge & mic toggle slot.
export default function ModuleShell({ icon: Icon, title, subtitle, level, right, testId, children }) {
  const cfg = level ? levelConfig(level) : null;
  return (
    <motion.section
      data-testid={testId}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-11 h-11 rounded-2xl bg-teal-glow/12 border border-teal-glow/25 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-teal-glow" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-slate-400 text-sm mt-1 max-w-xl">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cfg && (
            <div
              data-testid="module-level-badge"
              className="text-right"
            >
              <div className="text-[10px] font-mono text-slate-500 uppercase">Level {cfg.level}</div>
              <div className="text-sm font-semibold text-teal-glow">{cfg.label}</div>
            </div>
          )}
          {right}
        </div>
      </div>
      {children}
    </motion.section>
  );
}
