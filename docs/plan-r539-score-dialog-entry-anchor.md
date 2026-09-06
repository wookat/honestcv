# R539 — Score-breakdown dialog entry jumps open the source section

## Production evidence (CDP, 1280×900, index deployed after R538)
Seed: passive-voice bullet in a Projects entry. Open Builder → "See full score breakdown" →
the ATS structure finding "Active voice in bullet points — …" shows Fix →. Clicking it:

```
landing: {"activeEntryId":null,"inView":true,"activeText":"Skip to contentRezUp…","scrollY":0}
MATCH: False (expected the Projects entry card)
```

The dialog closes but nothing is focused or scrolled — the same collapsed-Projects failure
R538 fixed on the Score-card path.

## Root cause
R538 taught `jumpToEntry(id, anchor?)` to dispatch `JUMP_OPEN_EVENT` so a collapsed parent
section (Projects `defaultOpen={false}`, custom sections) mounts its entry card before the
DOM query. But the Score-breakdown dialog's `jumpEntry(id)` wrapper (and its
`onJumpEntry: (id: string) => void` prop) never forwards the finding's `anchor`, so entry
jumps from the dialog still query an unmounted card and silently no-op.

## Minimal fix (src/pages/Builder.tsx only)
- Dialog prop `onJumpEntry: (id: string, anchor?: SectionAnchor) => void` (Builder already
  passes `jumpToEntry`, whose signature matches).
- `jumpEntry(id: string, anchor?: SectionAnchor)` forwards the anchor after the close delay.
- All four dialog call sites pass the finding's anchor:
  `f.entryId ? jumpEntry(f.entryId, f.anchor) : …` and the `→ {entryLabel}` locate buttons.

## Non-goals
- No change to ats.ts, priorityFixes, check labels, scoring, or deep links.
- No change to the Score-card path (already fixed in R538).

## Verification
- tsc, eslint (touched files), build, verify-dist.
- Production QA 375/1280: breakdown-dialog Fix → for a Projects offender lands on the exact
  card with the section auto-expanded; experience entryLabel locate buttons regress clean;
  overflow 0, storage back to baseline keys.
