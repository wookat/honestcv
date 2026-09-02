# R233 — Timed answers with delivery metrics (pace + speaking time) in interview practice

## First-party Rezi evidence

- rezi.ai/rezi-docs/ai-interview-practice-pace: "Speaking Pace is one of five key interview
  communication metrics that Rezi AI Interview assesses you on… Rezi AI Interview measures your
  average speaking speed and compares it to an ideal interview range. This target range is
  **120–140 words per minute**."
- rezi.ai/rezi-docs/ai-interview-practice-speaking-time: "Speaking Time refers to how much of the
  response window you own… the goal is for you to own the majority of the response window —
  typically around **60–70% or more** — so your answers feel fully developed without becoming
  verbose." Feedback buckets: Underdeveloped / Appropriately complete / Overextended.
- rezi.ai/rezi-docs/ai-interview-practice-filler-words and -quick-fillers: filler frequency is
  also assessed (already covered locally by the R201 filler-phrase check).

## Gap

HonestCV's interview practice (R201) analyzes the *text* of an answer (length, STAR, keywords,
fillers) but has no notion of time. Two of Rezi's five delivery metrics — pace (wpm) and speaking
time (share of the response window) — are impossible to reproduce without an elapsed-time signal.

## Design

Add an opt-in **timed answer** mode to the practice dialog:

1. "Start 2-minute window" button next to the answer field starts a visible mm:ss countdown
   (2 minutes is our choice of window; Rezi does not publish its window length — the two targets
   below are first-party). User answers out loud while typing, then hits "Stop timer" (or the
   window runs out, which stops it automatically).
2. On stop, `analyzeDelivery(answer, elapsedSeconds)` (new pure function in
   `interviewAnalysis.ts`) derives:
   - `wpm = words / (elapsed / 60)`, banded against the Rezi target 120–140
     (slow < 120, ideal 120–140, fast > 140);
   - window share `= elapsed / 120`, banded under (< 60%), ideal (60–100%),
     over (timer expired — overextended), mirroring Rezi's
     Underdeveloped / Appropriately complete / Overextended buckets.
3. Two new rows in the existing instant-analysis card show wpm and window share with
   band-colored hints. Guard: no delivery rows unless elapsed ≥ 5 s and answer ≥ 10 words.

## Invariants

- `analyzeAnswer` and its score are untouched — delivery metrics are advisory display only.
- Zero schema change, zero AI calls, zero network; timer state is component-local and resets on
  question/session/dialog change.
- Untimed flow is byte-identical to R201 behavior (button is purely additive).

## Acceptance

- Timer counts down live; Stop and auto-expiry both produce delivery rows.
- wpm/band math spot-checked (e.g. 30 words in 15 s = 120 wpm ideal; 30 words in 20 s = 90 wpm slow).
- Window bands: stop at <72 s ⇒ under unless ≥72 s (60%); expiry ⇒ over.
- Practice score unchanged with and without timing; 375 px + dark mode legible.
