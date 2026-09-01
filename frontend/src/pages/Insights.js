import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, TrendingUp, Target, AlertTriangle, Sparkles, RotateCcw, Trash2, Lightbulb,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { analyzeWeakSpots } from "@/lib/progression";
import ModuleShell from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";

function StatCard({ label, value, sub, color, testId }) {
  return (
    <div data-testid={testId} className="glass rounded-2xl p-5">
      <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">{label}</div>
      <div className="text-3xl font-bold font-mono" style={{ color: color || "#f8fafc" }}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

const chartTooltip = {
  contentStyle: {
    background: "rgba(13,21,39,0.95)",
    border: "1px solid rgba(45,212,191,0.25)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "#f8fafc" },
};

export default function Insights() {
  const { history, profile, updateProfile, resetAll } = useApp();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const a = analyzeWeakSpots(history.attempts);

  const sessionTrend = history.sessions.map((s, i) => ({
    name: `#${i + 1}`,
    accuracy: Math.round(s.accuracy * 100),
    deviation: Math.round(s.avgCents),
  }));

  const registerChart = a.registerData
    .filter((r) => r.attempts >= 1)
    .map((r) => ({ note: r.note, accuracy: Math.round(r.accuracy * 100), avgCents: Math.round(r.avgCents) }));

  const intervalChart = a.intervalData.map((r) => ({
    name: r.label.replace(" ", "\n"),
    short: r.id,
    accuracy: Math.round(r.accuracy * 100),
  }));

  const barColor = (acc) => (acc >= 80 ? "#10b981" : acc >= 55 ? "#f59e0b" : "#f43f5e");

  const redo = () => {
    updateProfile({ onboarded: false });
    navigate("/onboarding");
  };

  const hasData = a.totalAttempts > 0;

  return (
    <ModuleShell
      icon={BarChart3}
      title="Weak Spots & Stats"
      subtitle="Your personal vocal analytics — where you shine and where to focus next."
      testId="weak-spots-container"
    >
      {!hasData ? (
        <div className="glass rounded-3xl p-10 text-center" data-testid="insights-empty">
          <Sparkles className="w-12 h-12 text-teal-glow mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No practice data yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Complete a few rounds in Note Match, Scales or Song Studio and your accuracy trends,
            weak registers and interval breakdowns will appear here.
          </p>
          <Button onClick={() => navigate("/match")} className="rounded-full bg-teal-glow text-slate-900 hover:bg-teal-300 font-semibold">
            Start Practising
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard testId="stat-attempts" label="Attempts" value={a.totalAttempts} />
            <StatCard testId="stat-accuracy" label="Overall Accuracy" value={`${Math.round(a.overallAccuracy * 100)}%`} color="#2dd4bf" />
            <StatCard testId="stat-deviation" label="Avg Deviation" value={`${a.avgCents > 0 ? "+" : ""}${Math.round(a.avgCents || 0)}¢`} color="#6366f1" />
            <StatCard
              testId="stat-bias"
              label="Pitch Bias"
              value={a.flatSharpBias.dir === "centered" ? "Centered" : a.flatSharpBias.dir === "flat" ? "Flat" : "Sharp"}
              color={a.flatSharpBias.dir === "centered" ? "#10b981" : a.flatSharpBias.dir === "flat" ? "#f59e0b" : "#f43f5e"}
              sub={a.flatSharpBias.dir !== "centered" ? `~${Math.round(a.flatSharpBias.cents)}¢ off` : "well balanced"}
            />
          </div>

          {/* recommendations */}
          <div data-testid="recs-action-card" className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-300" />
              <h3 className="font-semibold">Personalised recommendations</h3>
            </div>
            <ul className="space-y-2">
              {a.recommendations.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-teal-glow mt-0.5">▸</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* key weak spots */}
          <div className="grid md:grid-cols-3 gap-3">
            <div data-testid="flat-sharp-bias-card" className="glass rounded-2xl p-5">
              <Target className="w-5 h-5 text-tune-sharp mb-2" />
              <div className="text-[10px] font-mono uppercase text-slate-500">Weakest register</div>
              <div className="text-xl font-bold font-mono mt-1">
                {a.weakRegister ? a.weakRegister.note : "—"}
              </div>
              {a.weakRegister && (
                <div className="text-xs text-slate-400 mt-1">
                  {Math.round(a.weakRegister.accuracy * 100)}% accurate ·{" "}
                  {a.weakRegister.avgCents < -6 ? "trends flat" : a.weakRegister.avgCents > 6 ? "trends sharp" : "unstable"}
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-5">
              <AlertTriangle className="w-5 h-5 text-tune-flat mb-2" />
              <div className="text-[10px] font-mono uppercase text-slate-500">Hardest interval</div>
              <div className="text-xl font-bold font-mono mt-1">{a.weakInterval ? a.weakInterval.label : "—"}</div>
              {a.weakInterval && (
                <div className="text-xs text-slate-400 mt-1">{Math.round(a.weakInterval.accuracy * 100)}% accurate</div>
              )}
            </div>
            <div className="glass rounded-2xl p-5">
              <TrendingUp className="w-5 h-5 text-teal-glow mb-2" />
              <div className="text-[10px] font-mono uppercase text-slate-500">Sessions logged</div>
              <div className="text-xl font-bold font-mono mt-1">{history.sessions.length}</div>
              <div className="text-xs text-slate-400 mt-1">{profile.streak?.count || 0}-day streak</div>
            </div>
          </div>

          {/* accuracy trend */}
          {sessionTrend.length >= 2 && (
            <div className="glass rounded-2xl p-5" data-testid="accuracy-trend-chart">
              <h3 className="font-semibold mb-4">Accuracy over sessions</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={sessionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip {...chartTooltip} />
                  <Line type="monotone" dataKey="accuracy" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3, fill: "#2dd4bf" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* register accuracy */}
          {registerChart.length > 0 && (
            <div className="glass rounded-2xl p-5" data-testid="range-heatmap-chart">
              <h3 className="font-semibold mb-4">Accuracy by note</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={registerChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="note" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {registerChart.map((d, i) => (
                      <Cell key={i} fill={barColor(d.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* interval accuracy */}
          {intervalChart.length > 0 && (
            <div className="glass rounded-2xl p-5" data-testid="interval-accuracy-chart">
              <h3 className="font-semibold mb-4">Accuracy by interval</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={intervalChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
                  <XAxis dataKey="short" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {intervalChart.map((d, i) => (
                      <Cell key={i} fill={barColor(d.accuracy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* recent sessions table */}
          {history.sessions.length > 0 && (
            <div className="glass rounded-2xl p-5" data-testid="practice-history-table">
              <h3 className="font-semibold mb-3">Recent sessions</h3>
              <div className="space-y-1">
                {[...history.sessions].reverse().slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-sm">
                    <span className="text-slate-400 font-mono text-xs">{s.date}</span>
                    <span className="text-slate-300">{s.hits}/{s.total} notes</span>
                    <span className="font-mono font-semibold" style={{ color: barColor(Math.round(s.accuracy * 100)) }}>
                      {Math.round(s.accuracy * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* settings */}
      <div className="glass rounded-2xl p-5 mt-5" data-testid="settings-card">
        <h3 className="font-semibold mb-3">Settings</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={redo} variant="outline" className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
            <RotateCcw className="w-4 h-4 mr-2" /> Redo Range Test
          </Button>
          {!confirmReset ? (
            <Button onClick={() => setConfirmReset(true)} variant="outline" data-testid="reset-progress-btn"
              className="rounded-full border-rose-500/30 text-rose-300 bg-transparent hover:bg-rose-500/10">
              <Trash2 className="w-4 h-4 mr-2" /> Reset All Progress
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => { resetAll(); setConfirmReset(false); navigate("/onboarding"); }}
                data-testid="reset-confirm-btn"
                className="rounded-full bg-rose-500 hover:bg-rose-600 text-white">
                Confirm Reset
              </Button>
              <Button onClick={() => setConfirmReset(false)} variant="outline"
                className="rounded-full border-white/20 bg-transparent hover:bg-white/5">
                Cancel
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-3">All data lives only in this browser. Nothing is uploaded.</p>
      </div>
    </ModuleShell>
  );
}
