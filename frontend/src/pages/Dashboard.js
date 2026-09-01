import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mic, Target, Activity, Layers, Music, Wind, Disc, BarChart3,
  Flame, Sparkles, ChevronRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { midiToName } from "@/lib/audio/notes";
import { analyzeWeakSpots, levelConfig } from "@/lib/progression";

const MODULES = [
  { to: "/lab", label: "Pitch Lab", icon: Mic, desc: "Free-form sandbox", color: "#2dd4bf", key: null },
  { to: "/match", label: "Note Match", icon: Target, desc: "Hit target notes", color: "#06b6d4", key: "match" },
  { to: "/scales", label: "Scales", icon: Activity, desc: "Sing scale sequences", color: "#6366f1", key: "scales" },
  { to: "/octaves", label: "Octaves", icon: Layers, desc: "Jump octaves by memory", color: "#8b5cf6", key: "octaves" },
  { to: "/intervals", label: "Intervals", icon: Music, desc: "Ear training", color: "#ec4899", key: "intervals" },
  { to: "/breath", label: "Breathing", icon: Wind, desc: "Guided breath work", color: "#10b981", key: null },
  { to: "/songs", label: "Song Studio", icon: Disc, desc: "Karaoke pitch scoring", color: "#f59e0b", key: "songs" },
  { to: "/insights", label: "Weak Spots & Stats", icon: BarChart3, desc: "Track your progress", color: "#f43f5e", key: null },
];

export default function Dashboard() {
  const { profile, history } = useApp();
  const navigate = useNavigate();
  const analysis = analyzeWeakSpots(history.attempts);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8" data-testid="dashboard-container">
      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-teal-glow/10 blur-3xl" />
        <div className="relative">
          <p className="text-teal-glow font-mono text-xs uppercase tracking-wider mb-2">{greet}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to warm up your voice?
          </h1>
          <div className="flex flex-wrap gap-3">
            {profile.voiceType && (
              <div className="flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm">
                  <span className="text-slate-400">Voice type</span>{" "}
                  <span className="font-semibold text-indigo-300">{profile.voiceType}</span>
                </span>
              </div>
            )}
            {profile.rangeLow != null && (
              <div className="flex items-center gap-2 rounded-full bg-teal-glow/10 border border-teal-glow/30 px-4 py-2">
                <span className="text-sm font-mono text-teal-glow">
                  {midiToName(profile.rangeLow)} – {midiToName(profile.rangeHigh)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-2">
              <Flame className="w-4 h-4 text-amber-300" />
              <span className="text-sm">
                <span className="font-semibold text-amber-200">{profile.streak?.count || 0}</span>{" "}
                <span className="text-slate-400">day streak</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* recommended focus */}
      {analysis.totalAttempts >= 5 && analysis.recommendations[0] && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/insights")}
          data-testid="dashboard-focus-card"
          className="w-full text-left glass rounded-2xl p-5 flex items-center gap-4 hover:border-teal-glow/40 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-tune-sharp" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-mono uppercase text-slate-500 mb-0.5">Today's focus</p>
            <p className="text-sm text-slate-200">{analysis.recommendations[0]}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
        </motion.button>
      )}

      {/* module grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {MODULES.map((m, i) => {
          const Icon = m.icon;
          const lvl = m.key ? profile.levels[m.key] : null;
          return (
            <motion.button
              key={m.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(m.to)}
              data-testid={`dashboard-card-${m.to.slice(1) || "home"}`}
              className="group glass rounded-2xl p-5 text-left hover:-translate-y-1 hover:border-teal-glow/40 transition-all duration-300"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${m.color}22`, border: `1px solid ${m.color}44` }}
              >
                <Icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
              <h3 className="font-semibold mb-0.5">{m.label}</h3>
              <p className="text-xs text-slate-400">{m.desc}</p>
              {lvl && (
                <p className="text-[10px] font-mono text-teal-glow mt-2">
                  Lv {lvl} · {levelConfig(lvl).label}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
