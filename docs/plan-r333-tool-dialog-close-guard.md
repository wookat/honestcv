# R333 — confirm before discarding unsaved work in the Builder tool dialog

## Evidence

Source-confirmed (Builder.tsx `BundleToolDialog`): the Cover Letter /
Resignation Letter / Interview Prep dialog holds all of its state in plain
`useState` — the multi-question interview session (questions, typed answers,
per-answer feedback), the standalone typed answer, and a generated letter —
and `onOpenChange` closed unconditionally. One Esc press, overlay click, or X
click mid-session silently discarded everything; the session report is never
persisted anywhere. Highest-cost typing surface after resume paste
(`/ats-checker`, fixed in R330) — same Rezi "don't lose your place" standard,
and the same confirm-before-destructive pattern as R191 (untrack) and the
existing `applyExample` `window.confirm` guard.

## Change (Builder.tsx, BundleToolDialog only)

`unsavedWork` = interview: `session !== null || answer.trim() !== ''`;
letters: `result !== '' && savedId === null` (saved letters close freely).
`requestClose()` wraps `onClose` behind `window.confirm` (existing repo
convention) only when `unsavedWork`; wired into the dialog's `onOpenChange`.
No persistence added; no other dialog, worker, or schema change.

## QA (production)

Esc/overlay/X with an in-progress interview session or typed answer →
confirm; Cancel keeps the dialog and state intact, OK closes. Generated
unsaved letter → confirm; after "Save to documents" closes freely. Pristine
dialog closes freely. 375 strict + dark regression, zero AI, baselines.
