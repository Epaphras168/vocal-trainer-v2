// Local-only persistence for profile, practice history, streak & sessions.

const PROFILE_KEY = "vt_profile_v1";
const HISTORY_KEY = "vt_history_v1";

export const SKILL_BASE_LEVEL = { beginner: 1, some: 2, trained: 3 };

export function defaultProfile() {
  return {
    onboarded: false,
    rangeLow: null,
    rangeHigh: null,
    voiceType: null,
    skill: "beginner",
    levels: { match: 1, scales: 1, octaves: 1, intervals: 1, songs: 1 },
    adaptiveTolerance: {}, // per module dynamic cents tolerance
    streak: { count: 0, last: null },
    createdAt: new Date().toISOString(),
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { attempts: [], sessions: [] };
    const h = JSON.parse(raw);
    return { attempts: h.attempts || [], sessions: h.sessions || [] };
  } catch {
    return { attempts: [], sessions: [] };
  }
}

export function saveHistory(h) {
  const trimmed = {
    attempts: h.attempts.slice(-2500),
    sessions: h.sessions.slice(-500),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Returns updated streak given last practice date.
export function bumpStreak(streak) {
  const today = todayStr();
  if (streak.last === today) return streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streak.last === yesterday) {
    return { count: streak.count + 1, last: today };
  }
  return { count: 1, last: today };
}
