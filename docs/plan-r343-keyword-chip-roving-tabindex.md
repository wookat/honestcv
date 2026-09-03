# R343 — roving tabindex for missing-keyword chip groups in the Target job panel

## Evidence (R341 production QA, new P3)

- The Target job panel renders each missing JD keyword as a 3-button chip
  (`+ <kw>` add-to-skills / `Draft a bullet using <kw>` / `Mark <kw> as not relevant`),
  split into High priority and Remaining tiers.
- With a realistic JD, R341 QA measured the draft-bullet chips at ~295 Tab stops from the
  JD textarea: every chip contributes 3 stops, so 20 missing keywords = 60 stops on top of
  the already long edit column. Keyboard discoverability is effectively zero.
- Bonus defect for keyboard users: clicking add/ignore unmounts the chip, dropping focus
  to BODY — the user is thrown back to the top of the tab order after every action.

## Design (ARIA toolbar / roving-tabindex pattern)

New small component in Builder.tsx: `RovingChipGroup` — a `role="group"` wrapper that turns
its descendant buttons into ONE Tab stop:

- Container tracks the active button; only that button has `tabIndex=0`, all others `-1`
  (classic roving tabindex; W3C APG toolbar pattern).
- ArrowRight/ArrowLeft move focus between buttons (no wrap needed; Home/End jump to
  first/last). `preventDefault()` so arrows don't scroll.
- `onFocusCapture` keeps the roving index in sync with clicks/tabs.
- When the focused button unmounts (chip consumed by add/ignore), a layout effect refocuses
  the button at the clamped previous index — keyboard users stay inside the group instead of
  falling to BODY.

Applied to the two tier chip lists only. Visuals, mouse behavior, chip markup, and the
one-at-a-time triage card above are unchanged. Screen readers get `aria-label`
"High priority missing keywords" / "Remaining missing keywords" on the groups.

## Non-goals

- Tailoring-dialog silent Esc with unreviewed suggestions — still under observation.
- Other long-tab-order surfaces (already-closed R342 bars; entry cards are fine).

## Verification

- Local: tsc / lint / build.
- Production QA (zero AI, mock keyword-bullet POST): tab from JD textarea reaches the High
  priority group in a handful of stops; one Tab stop per group; arrows traverse all three
  buttons per chip; Enter on `+ kw` adds to Skills and focus stays in the group on the next
  chip; Enter on ignore ditto; Enter on the sparkles button opens the draft dialog and Esc
  returns focus to that exact chip button (R340); 375px + dark; baselines restored.
