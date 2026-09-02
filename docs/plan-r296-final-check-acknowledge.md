# R296: stop re-showing the final-check dialog for an unchanged issue list

## Evidence (first-hand)

- Rezi's Finish Up & Preview guide (rezi.ai/rezi-docs/the-finish-up-tab, fetched 2026-08-31)
  frames the final check as a one-time review step before download — not a gate that
  interrupts every download.
- Our production behavior (confirmed in the R290 and R295 exploratory audits, recorded as a
  deferred candidate in docs/plan-r295-audit-fixes.md F3): `download()` in Builder.tsx opens
  the "Final check before download" dialog whenever `finalCheckIssues.length > 0`. A user who
  reviewed the list and clicked "Download anyway" gets the identical dialog again on their
  very next download (e.g. PDF then DOCX of the same resume), with zero new information.
- `skipFinalCheck=true` is only passed for the single retried format, so switching formats
  re-triggers the dialog even seconds later.

## Change

Track the issue list the user last acknowledged via "Download anyway" (session-scoped React
ref, not persisted):

- `finalCheckAcked` ref stores the exact `finalCheckIssues` signature (joined string) at the
  moment the user clicks "Download anyway".
- `download()` shows the dialog only when issues exist AND their signature differs from the
  acknowledged one.
- Fixing or introducing an issue changes the signature, so the dialog returns with the new
  list. "Keep editing" does not acknowledge anything. Reloading the page resets the ref.

## Non-goals

- No persistence to localStorage (a stale ack across sessions could hide real regressions).
- No change to the free-download gate, unlock gate, or the issue computation itself.
- No "don't show again" checkbox — acknowledgment is implied by "Download anyway".
