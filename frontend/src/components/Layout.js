import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Mic,
  Target,
  Activity,
  Layers,
  Music,
  Wind,
  Disc,
  BarChart3,
  Flame,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const NAV = [
  { to: "/", label: "Home", icon: Home, testId: "nav-home" },
  { to: "/quest", label: "Quick Quest", icon: Sparkles, testId: "nav-quick-quest" },
  { to: "/lab", label: "Pitch Lab", icon: Mic, testId: "nav-pitch-lab" },
  { to: "/match", label: "Note Match", icon: Target, testId: "nav-note-match" },
  { to: "/scales", label: "Scales", icon: Activity, testId: "nav-scales" },
  { to: "/octaves", label: "Octaves", icon: Layers, testId: "nav-octaves" },
  { to: "/intervals", label: "Intervals", icon: Music, testId: "nav-intervals" },
  { to: "/breath", label: "Breathing", icon: Wind, testId: "nav-breath" },
  { to: "/songs", label: "Songs", icon: Disc, testId: "nav-songs" },
  { to: "/insights", label: "Insights", icon: BarChart3, testId: "nav-insights" },
];

function StreakBadge() {
  const { profile } = useApp();
  const navigate = useNavigate();
  return (
    <button
      data-testid="streak-badge"
      onClick={() => navigate("/insights")}
      className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-amber-300 hover:bg-amber-500/20 transition-colors"
    >
      <Flame className="w-4 h-4" />
      <span className="font-mono text-sm font-semibold">{profile.streak?.count || 0}</span>
    </button>
  );
}

const NavItem = ({ item, compact }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      data-testid={item.testId}
      className={({ isActive }) =>
        `group flex ${compact ? "flex-col gap-0.5 min-w-[64px] px-2 py-1.5" : "items-center gap-2 px-3.5 py-2"} rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-teal-glow/15 text-teal-glow"
            : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`${compact ? "w-5 h-5" : "w-4 h-4"} shrink-0 ${isActive ? "drop-shadow-[0_0_8px_rgba(45,212,191,0.7)]" : ""}`} />
          <span className={`${compact ? "text-[10px]" : "text-sm"} font-medium whitespace-nowrap`}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen aurora-bg grain relative">
      {/* Desktop floating pill nav */}
      <header className="hidden md:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 items-center gap-1">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl px-2 py-2 flex items-center gap-1"
        >
          {NAV.map((n) => (
            <NavItem key={n.to} item={n} />
          ))}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <StreakBadge />
        </motion.nav>
      </header>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 glass-strong px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-glow/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-teal-glow" />
          </div>
          <span className="font-semibold tracking-tight">Vocal Trainer</span>
        </div>
        <StreakBadge />
      </div>

      <main className="relative z-10 pt-16 pb-28 md:pt-28 md:pb-12 px-4 sm:px-6 max-w-5xl mx-auto">
        {children}
      </main>

      {/* Mobile bottom nav (scrollable) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-teal-500/15">
        <div className="flex overflow-x-auto no-scrollbar px-2 py-2 gap-1">
          {NAV.map((n) => (
            <NavItem key={n.to} item={n} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}
