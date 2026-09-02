# R225 — "Fixed" tracking on ATS structure checks (Builder + /ats-checker)

## First-party evidence (Rezi public surface)

- https://www.rezi.ai/rezi-docs/the-rezi-score-explained — "How to Use Rezi Score", step 5
  "Improve your Rezi Score":
  > "As you apply suggestions, your score updates automatically, so you can see your
  > progress as you go. As you complete recommendations, Rezi marks them with a green
  > checkmark, so you'll know exactly what you've fixed and what still needs attention."
- Same doc, step 4: feedback deep-links back into the builder — recommendations are a
  work-through list where users track completion, not a static report.

## Gap

HonestCV's Score breakdown (24 checks) and /ats-checker (22 checks) render live ✓/✗
state, but a passing row looks identical whether it always passed or the user just
repaired it. After acting on a hint, the row silently moves into the pass group —
there is no "you fixed this" feedback, so progress within a session is invisible
(the R224 category pass counts move, but not which row moved).

## Design (presentation-only, zero scoring change)

- **Builder**: track previous `pass` per check label across ATS recomputes
  (`useRef<Map<string, boolean>>`). When a label transitions `false → true`, add it to a
  session `fixed` set; if it later regresses `true → false`, remove it. The first
  observation only seeds the map (nothing marked on load). Passing rows in the `fixed`
  set render a small emerald "Fixed" chip after the label. Cleared on reload (session
  scope, no persistence).
- **/ats-checker**: keep the previous scan's checks when the user re-runs
  "Check my ATS score" in the same session. Labels failing in the previous scan and
  passing now render the same "Fixed" chip. First scan marks nothing; chip set is
  recomputed per scan (not sticky across regressions).
- No change to check logic, order, categories (R224), scores, priority fixes, or
  deep links. Chip is a `<span>` styled like existing emerald badges; counts unchanged.

## Acceptance

1. Builder: break a check (e.g. delete LinkedIn URL) → row fails; restore it → row
   passes **with "Fixed" chip**; untouched passing rows show no chip.
2. Builder: regress the same check again → chip gone, row fails; fix → chip returns.
3. Reload → no chips.
4. Checker: scan failing text → no chips; edit text, rescan → repaired rows show
   "Fixed since last check"; rows that always passed show nothing.
5. Scores, category counts (12+5+7 / 11+4+7), priority fixes byte-identical to R224.
6. 375px no overflow with chips visible; dark-mode chip contrast ≥ 4.5:1.
