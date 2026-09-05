# R403 (SOP-10 node) — styled confirm dialogs for the two native `window.confirm` replace guards

## Audit summary

Four-dimension production audit (index-xQfsXRHE.js era): zero P0–P2.
Findings: P3 — example replacement runs `window.confirm` INSIDE the `setResume`
updater (Builder `applyExample`), and the ATS checker's "open in builder"
replace guard is also a native `window.confirm` (AtsChecker `openInBuilder`).
P4s banked: `/jobs?job=<unknown>` silently falls back to the first result;
~1MB ATS draft restores with a ~10s synchronous freeze; `updatedAt: 0` docs
render "Edited 20701 days ago".

## Why the P3 matters

- Side effect (blocking native dialog) inside a React state updater — the only
  such pattern left in the app; updaters must be pure (StrictMode double-invoke
  would show the dialog twice in dev).
- Native chrome is inconsistent with every other guarded destructive action
  (delete copy, discard unsaved work, restore backup — all styled Dialogs).
- In embedded/webview/automation contexts that suppress native dialogs the
  renderer hard-blocks (reproduced: 100% CPU pin under headless CDP).

## Fix

Builder (`applyExample`): decision moves out of the updater. A content check
(`resume.contact.fullName || resume.summary`, via ref so `applyExample` stays
referentially stable for the examples-fetch effect) arms
`pendingExample: ExamplePerson | null`; a styled Dialog ("Load this example?",
Cancel / "Replace with example") confirms, then `linkVersion(null)` +
`setResume` with the template-preservation rule unchanged. Empty drafts apply
immediately, as before.

AtsChecker (`openInBuilder`): same split. No saved content → replace and
navigate immediately (unchanged). Otherwise a styled Dialog with the two
original outcomes as explicit buttons: "Keep saved resume" (R387 semantics —
carry the JD only when the JD box is non-empty, then navigate) and
"Replace resume" (parse pasted text, clear active version, save, navigate).
Escape/outside-click closes and stays on the page (strictly safer superset).

## Non-goals

The other `window.confirm` uses (discard-unsaved-work guards) are consistent
cancel-only guards outside updaters — out of scope. P4s stay banked.

## Verification

tsc/lint/build; production QA: both dialogs (appearance, replace path,
keep-saved path incl. JD carry-over byte assertions, cancel/Escape no-op),
empty-draft immediate paths, deep-link `?example=` flow, wizard flow,
375px light/dark, zero console errors, baseline restore.
