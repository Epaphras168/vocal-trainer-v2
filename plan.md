# Vocal Trainer — Quick Quest increment

## Implementation approach

Add a lightweight, repeatable **Quick Quest** loop on top of the existing frontend-only audio and progression architecture. The challenge reuses the existing `AudioEngine`, `usePitchTarget`, microphone gate, profile range, and `recordAttempt` persistence instead of introducing accounts, a backend, or a second scoring system.

The home dashboard becomes more action-oriented: a primary CTA starts the Quick Quest, while existing modules remain available as deeper practice paths. Quick Quest is an 8-note, 60-second pitch sprint with a combo score, live hold progress, target replay, round counter, and a completion state. It is intentionally curriculum-agnostic so future lessons can plug into the same practice loop.

## Design direction

- **Design movement:** Calm Aurora / instrument-panel minimalism — focused, atmospheric, and tactile rather than gamified-noisy.
- **Core principles:** one obvious next action; feedback is immediate and legible; celebrate consistency, not perfection; keep the learner in flow.
- **Color philosophy:** retain deep indigo/teal for calm focus, use amber for momentum/combo, and emerald for successful pitch hits.
- **Layout paradigm:** a single centered challenge stage with a compact progress rail and secondary controls underneath; the dashboard leads with one primary practice path before the module library.
- **Signature elements:** glowing pitch target ring, compact combo badge, and a horizontal quest progress rail.
- **Interaction philosophy:** short rounds, replayable targets, no dead ends, and a clear reset/continue action after completion.
- **Animation:** subtle lift on entry, pulse while holding pitch, quick success flash, and smooth progress transitions; avoid distracting continuous motion.
- **Typography system:** Plus Jakarta Sans for readable UI and JetBrains Mono for notes, scores, and timing.
- **Brand essence:** a private, playful vocal practice companion that turns “I should practise” into one focused minute. Personality: calm, encouraging, precise.
- **Brand voice:** direct and warm. Example lines: “Find the note. Hold the moment.” and “One more round, your voice is warming up.”
- **Wordmark & logo:** preserve the existing microphone mark and aurora glow; the Quick Quest adds a small target-ring motif rather than a new brand.
- **Signature brand color:** luminous teal `#2dd4bf`.

## Project structure

- `frontend/src/pages/QuickQuest.js`: time-boxed interactive pitch sprint.
- `frontend/src/pages/Dashboard.js`: primary CTA and Quick Quest preview.
- `frontend/src/App.js`: `/quest` route.
- `frontend/src/components/Layout.js`: navigation entry for the new loop.
- `frontend/public/manus-routes.json`: route manifest for the added page.

## Constraints

- Frontend-only and localStorage-backed; no new backend or account flow.
- Reuse existing microphone permission and live pitch utilities.
- Keep all existing modules and routes intact.
- Do not require a finalized curriculum; content remains a reusable practice format.
