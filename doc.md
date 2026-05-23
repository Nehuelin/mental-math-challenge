# Mental Math Challenge — Features and Implementation Decisions

## 1) Product Objective

The app is designed to train **mental arithmetic speed, accuracy, and consistency** through short rounds that combine configurable difficulty, immediate feedback, and post-round analytics. The experience is intentionally arcade-like (countdown, music, sound effects, score reveal animations) to make repetition engaging instead of repetitive.

Core product goals:
- Let players quickly configure a round with meaningful options.
- Keep every question loop fast and readable under time pressure.
- Reward both correctness and speed, while still exposing mistakes clearly.
- Persist local history so users can measure long-term improvement.

---

## 2) High-Level Architecture

The app follows a **single-root state orchestration** pattern in `App.js`, where the active screen is controlled by a small finite flow:

- `setup` → `game` → `scoreReveal` → `summary` → (restart or back to setup)

This architecture keeps transitions deterministic and avoids introducing navigation complexity for a compact app. The root component also centralizes:
- app-wide music state,
- persistent-history loading/saving,
- transition animations,
- and shared settings passed to gameplay.

This is a deliberate tradeoff:
- ✅ Simpler for a small game loop with known screens.
- ⚠️ Less modular than a full navigator if the app grows into many routes.

---

## 3) Core User Features

## 3.1 Setup and Round Configuration

Users can configure:
- **Difficulty** (`easy`, `medium`, `hard`) with per-question time behavior.
- **Dynamic difficulty toggle**, which tightens available response time after correct answers.
- **Game mode** with at least classic and time-trial behavior.
- **Iteration count** for non-time-trial rounds.

Why this design:
- The settings balance **player control** (manual difficulty/length) with **adaptive challenge** (dynamic timing).
- Non-time-trial iteration controls keep classic rounds predictable and easier to compare over time.
- Setup also surfaces progress context (high score, saved rounds), which creates motivation before starting a run.

## 3.2 Gameplay Loop

Each question cycle includes:
1. A short **pre-round countdown**.
2. Question rendering + answer input.
3. Per-question timer management.
4. Submission evaluation (correct/incorrect/timeout).
5. Score calculation and feedback.
6. Transition to next question or end-of-round flow.

Time-trial mode introduces a different fail condition and optional bonus-time behavior, so gameplay tension changes significantly by mode.

Why this design:
- A strict cycle keeps players in a rapid “solve → evaluate → continue” rhythm.
- Separating “question generation” from “scoring” utilities keeps game logic testable and extensible.
- Locking submissions during evaluation avoids race conditions from repeated taps/enter presses.

## 3.3 Score Reveal Experience

After a round, the app presents an **animated score reveal** with milestone components:
- base points,
- speed bonus,
- quick-answer bonus,
- penalties.

Each milestone is revealed sequentially with sound feedback and number animation.

Why this design:
- Players can understand *how* the final score was built (not just what it is).
- Sequencing milestones improves transparency and emotional payoff.
- Positive and negative sounds reinforce performance interpretation.

## 3.4 Summary Analytics

The summary screen includes:
- scoreboard stats (accuracy, correct/incorrect/timeouts, response-speed stats, totals),
- accuracy pie-chart visualization,
- score contribution bars,
- speed-by-question bar chart,
- expandable full question register.

Why this design:
- Encourages reflective practice (where did I lose points/time?).
- Visual summaries support quick insight without reading dense logs.
- Expand/collapse sections keep the UI manageable on mobile while still offering depth.

## 3.5 Local History and Progress

The app stores finished rounds locally and displays:
- high score,
- rounds played,
- recent saved matches,
- history reset action.

Why this design:
- Persistence is essential for training apps; improvement is the product.
- Local-first storage avoids account complexity and makes onboarding frictionless.

---

## 4) Audio and Feedback System Decisions

The app uses two layered audio systems:

1. **Background music** at app/screen level.
2. **Sound effects** for gameplay events.

Implementation decisions:
- Music is tied to screen context (setup, in-game random track choice, score reveal track).
- All tracks are looped and reset on transitions to avoid overlapping playback.
- Audio mode is configured to support play in silent mode.

Why this matters:
- Reinforces mode changes and emotional pacing.
- Prevents audio-state bugs common in screen transitions.
- Gives immediate reinforcement for correct, incorrect, countdown, and level-up states.

---

## 5) Timing and Difficulty Model

The timing model separates:
- per-question remaining time,
- question time-limit state,
- time-trial total remaining time,
- and optional dynamic reductions after correct answers.

Key decisions:
- Timers are derived from timestamps and updated on intervals rather than blindly decrementing counters.
- Dynamic difficulty enforces a floor (`minDynamicTimeMs`) to avoid impossible rounds.
- Timeout is modeled explicitly as a first-class result state, not a special-case incorrect answer.

Why this design:
- Timestamp-based calculations are generally more stable against interval jitter.
- Explicit timeout semantics improve analytics and fair scoring.
- Dynamic-time floors preserve playability while still increasing pressure.

---

## 6) Scoring Transparency and Fairness

The scoring pipeline appears intentionally decomposed into utilities:
- per-question score breakdown generation,
- round summarization,
- final score component aggregation.

The decision to persist per-answer metadata (response time, timeout flag, points, breakdown) enables:
- granular post-game analysis,
- transparent score explainability,
- flexible future balancing changes.

Why this design is strong:
- You can rebalance formulas later without redesigning UI contracts.
- Players trust systems more when reward/penalty logic is inspectable.

---

## 7) UI/UX Interaction Decisions

Notable interaction decisions include:
- bold visual hierarchy with card sections,
- deployable/accordion blocks for advanced details,
- animated transitions between app-level screens,
- immediate correctness feedback after each submission,
- concise bilingual-friendly symbols and score shorthand.

Why this design:
- Card + section structure works well on mobile for dense stat content.
- Progressive disclosure avoids overwhelming novice players.
- Transition and feedback animations reduce perceived latency and increase engagement.

---

## 8) State Management Choices

Current state management is React hooks-only (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`) with no global store library.

Why this is a good fit now:
- The state graph is relatively constrained and screen flow is linear.
- Hooks keep dependencies explicit and reduce architectural overhead.

Potential future evolution:
- If competitive features, cloud sync, profiles, or multi-route content are added, the app may benefit from structured navigation and state domains.

---

## 9) Reliability and Defensive Patterns

Several implementation patterns improve reliability:
- “finished” and “lock” refs to prevent duplicate submissions/round completions.
- Cleanup handlers that stop animations and intervals.
- Safe async loading of history with mounted guards.
- User-facing storage error banners when local operations fail.

Why this matters:
- Mobile timing/UI code is prone to double-fire and lifecycle race conditions.
- Defensive refs and cleanup routines reduce hard-to-debug score/data bugs.

---

## 10) Performance Considerations

Observed performance-oriented choices:
- memoized derived values (`useMemo`) for score/timer ratios and chart inputs.
- memoized callbacks (`useCallback`) for frequently passed handlers.
- lightweight local calculations for stat rendering.
- native-driver usage for many animations where possible.

Why this matters:
- Gameplay depends on responsiveness under frequent state updates.
- Smooth animation + timer stability directly influences perceived quality.

---

## 11) Expo/React Native Platform Considerations

The project uses Expo and Expo modules (notably audio), and design choices appear aligned with cross-platform mobile expectations:
- simple root-level navigation flow without native routing complexity,
- local persistence for offline friendliness,
- asset-bundled music/SFX for deterministic playback.

Given the SDK direction around Expo 55 and its React Native baseline, these choices keep the app close to standard Expo workflows and easier to maintain across device targets.

---

## 12) Tradeoffs and Future Opportunities

Current tradeoffs:
- Single-file orchestration in `App.js` is simple but can grow dense.
- Local-only history is privacy-friendly but lacks multi-device continuity.
- Manual chart composition provides flexibility but may require additional a11y refinements over time.

Potential next improvements:
- Add player profiles and trend analytics over weekly/monthly windows.
- Introduce configurable operation families (only multiplication, mixed sets, etc.).
- Add accessibility-focused controls (reduced motion, larger text presets, haptic toggles).
- Add optional cloud backup/sync for history.
- Add lightweight telemetry hooks for balancing score formulas with real usage data.

---

## 13) Conclusion

This app is architected as a **focused, high-feedback training loop**: quick setup, intense timed play, transparent scoring, and reflective post-round analysis. Most decisions prioritize motivation and retention without introducing infrastructure overhead too early. That makes the current implementation practical for iteration and well-positioned for incremental expansion.