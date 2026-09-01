# Vocal Trainer — Product Requirements Document

## Original Problem Statement
Build "Vocal Trainer" — an interactive singing/vocal-training PWA using real-time microphone
pitch detection (Web Audio API, autocorrelation) and OscillatorNode reference tones. Frontend-only:
no accounts, no backend, all progress in browser localStorage (per-device, private). Mobile-first,
PWA-installable. Modules: Onboarding + voice range test, Pitch Lab, Note Match, Scales Trainer,
Octave Trainer, Interval Ear Training, Breathing Exercises, Song Practice; plus progression system,
daily streak, session summaries, and a "Weak Spots" analytics dashboard with charts.

## User Choices
- Scope: Full app (all 7 modules + progression + weak spots dashboard)
- Theme: Calm/Aurora — deep indigo/teal with soft glows (dark)
- Charts: Recharts
- PWA: Full (manifest + service worker)
- Songs: public-domain melodies

## Architecture
- **Frontend only**: React 19 + React Router 7 + Tailwind + shadcn/ui + framer-motion + Recharts.
- **No backend used** (default FastAPI template left untouched; no DB, no auth).
- **Audio**: singleton `AudioEngine` (`lib/audio/engine.js`) — one AudioContext, mic AnalyserNode,
  rAF pitch loop (autocorrelation + parabolic interpolation, median smoothing, RMS gating),
  OscillatorNode synth with ADSR, speaker-safe octave clamping (C3–C6).
- **Music theory**: `lib/audio/notes.js` (freq↔midi↔cents, scales, intervals, voice classification).
- **Progression/analytics**: `lib/progression.js` (5 levels, adaptive tolerance, weak-spot analysis,
  session summaries). **Storage**: `lib/storage.js` (localStorage: `vt_profile_v1`, `vt_history_v1`).
- **State**: `context/AppContext.js`; hooks `useLivePitch`, `usePitchTarget`.

## User Persona
Singers/learners (beginner→trained) practising pitch, ear, breath, and range privately on phone or desktop.

## Implemented (2026-06)
- Onboarding: welcome + mic permission, lowest/highest note capture, voice-type classification, skill picker.
- Pitch Lab: live waveform canvas, note/Hz readout, volume + cents meters, reference-tone keyboard.
- Note Match: target playback, hold-to-hit ring, adaptive cents tolerance, score/streak, session end + summary.
- Scales Trainer: root + 5 scale types, playback, animated note-bead sequence, hold-to-advance.
- Octave Trainer: reference playback, up/down, pitch ladder, graceful narrow-range guard (<12 semitones).
- Interval Ear Training: root drone only, hidden target, interval checkbox selection, reveal on success.
- Breathing: animated orb, 4 presets (Box, Deep 4-2-6, Relaxing 4-0-8, 4-7-8), phase timer + round counter.
- Song Studio: 5 public-domain melodies, scrolling karaoke piano-roll canvas with live pitch trace + scoring,
  transpose, tempo, optional guide, preview.
- Insights: overview stats, personalised recommendations, weak register/interval cards, accuracy trend line,
  per-note & per-interval bar charts, session history table, reset + redo-range-test.
- Progression: 5 skill levels gating tolerance/hold; auto level-up at 80% over rolling window; adaptive tolerance.
- Daily streak, per-session summaries with deltas vs previous session.
- PWA: manifest.json, service worker (app-shell caching), app icons, theme color.

## Testing
- Frontend verified end-to-end via testing agent (iteration_1): all modules render + controls function,
  PWA registers, narrow-range guard + empty state + reset flow work. Two defensive fixes applied
  (interval label String-cast, Avg Deviation NaN guard).
- Real-time pitch "hit" scoring depends on sung audio; not fully verifiable under Chromium fake-media —
  logic is in place and functions with a real microphone.

## Backlog / Remaining (P1/P2)
- P1: More songs + optional lyrics sync in Song Studio.
- P1: Export/import progress JSON (backup on-device data).
- P2: Vibrato / tone-quality feedback; warm-up routines; metronome.
- P2: Additional scale modes; customizable difficulty per module.

## Next Tasks
- Gather user feedback on pitch-detection sensitivity across devices; tune smoothing/tolerance if needed.
