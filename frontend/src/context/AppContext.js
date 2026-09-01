import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import engine from "@/lib/audio/engine";
import {
  loadProfile,
  saveProfile,
  loadHistory,
  saveHistory,
  bumpStreak,
} from "@/lib/storage";
import { shouldLevelUp, buildSessionSummary } from "@/lib/progression";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => loadProfile());
  const [history, setHistory] = useState(() => loadHistory());
  const [micRunning, setMicRunning] = useState(false);
  const [micPermission, setMicPermission] = useState(engine.permission);
  const [micError, setMicError] = useState(null);
  const sessionAttempts = useRef([]);
  const [sessionCount, setSessionCount] = useState(0);

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      saveProfile(next);
      return next;
    });
  }, []);

  const startMic = useCallback(async () => {
    setMicError(null);
    const res = await engine.startMic();
    setMicPermission(engine.permission);
    if (res.ok) {
      setMicRunning(true);
    } else {
      setMicError(res.error || "error");
      setMicRunning(false);
    }
    return res;
  }, []);

  const stopMic = useCallback(() => {
    engine.stopMic();
    setMicRunning(false);
  }, []);

  const recordAttempt = useCallback((attempt) => {
    const full = { ...attempt, ts: new Date().toISOString() };
    sessionAttempts.current.push(full);
    setSessionCount((c) => c + 1);
    setHistory((prev) => {
      const next = { ...prev, attempts: [...prev.attempts, full] };
      saveHistory(next);
      return next;
    });
    // Level up check for the module
    if (attempt.module) {
      setProfile((prev) => {
        const moduleAttempts = [...history.attempts, full].filter(
          (a) => a.module === attempt.module
        );
        const curLevel = prev.levels[attempt.module] || 1;
        if (curLevel < 5 && shouldLevelUp(moduleAttempts)) {
          const next = {
            ...prev,
            levels: { ...prev.levels, [attempt.module]: curLevel + 1 },
          };
          saveProfile(next);
          return next;
        }
        return prev;
      });
    }
  }, [history.attempts]);

  const endSession = useCallback(() => {
    const attempts = sessionAttempts.current;
    if (!attempts.length) return null;
    let summary = null;
    setHistory((prev) => {
      const prevSession = prev.sessions[prev.sessions.length - 1] || null;
      summary = buildSessionSummary(attempts, prevSession);
      const next = { ...prev, sessions: [...prev.sessions, summary] };
      saveHistory(next);
      return next;
    });
    setProfile((prev) => {
      const next = { ...prev, streak: bumpStreak(prev.streak) };
      saveProfile(next);
      return next;
    });
    sessionAttempts.current = [];
    setSessionCount(0);
    return summary;
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem("vt_profile_v1");
    localStorage.removeItem("vt_history_v1");
    const p = loadProfile();
    setProfile(p);
    setHistory({ attempts: [], sessions: [] });
    sessionAttempts.current = [];
    setSessionCount(0);
  }, []);

  useEffect(() => {
    return () => engine.stopMic();
  }, []);

  const value = {
    engine,
    profile,
    history,
    updateProfile,
    micRunning,
    micPermission,
    micError,
    startMic,
    stopMic,
    recordAttempt,
    endSession,
    resetAll,
    sessionCount,
    getLevel: (m) => profile.levels[m] || 1,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
