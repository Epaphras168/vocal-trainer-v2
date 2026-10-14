# Vocal Trainer TODO

## Quick Quest is available from the home screen

- The home screen presents Quick Quest as the primary practice action.
- Starting Quick Quest navigates to the interactive pitch sprint.
- Existing practice modules remain discoverable and unchanged.

## Quick Quest delivers a complete interactive practice loop

- The challenge presents eight target notes selected within the learner's saved range.
- The challenge runs for up to 60 seconds and shows the current round, score, combo, target note, replay control, live cents feedback, and hold progress.
- A correct held pitch advances the round, records an attempt through the existing local progression system, and increases the combo score.
- The challenge ends when all eight notes are completed or the timer reaches zero.
- The completion state offers a clear retry action and preserves the result on-device through existing history recording.
- Microphone permission and denial states use the existing app behavior and privacy language.

## Existing app remains stable

- Existing routes, modules, PWA behavior, and local-only architecture remain intact.
- The route manifest includes every current page plus `/quest`.
- The frontend builds successfully with the repository's existing build command.
