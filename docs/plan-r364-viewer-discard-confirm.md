# R364: confirm before discarding unsaved edits in the document viewer

## Evidence (firsthand)
- Production /documents (and dashboard "Career documents" Open) viewer dialog:
  the textarea edits live in `docText` state and are only persisted by the
  "Save changes" button. Closing via Esc, the X button, or the overlay calls
  `setOpenDoc(null)` unconditionally — unsaved edits are silently discarded.
- The dialog's own description says "edits are saved to this browser", which
  is misleading while an unsaved edit is being dropped.
- Established convention elsewhere: the Builder tool dialog confirms before
  discarding an unsaved generated document (R333) and the tailor dialog
  confirms before discarding unreviewed suggestions (R344). The viewer is the
  remaining editing dialog without the guard.

## Change (smallest evidence-backed)
- `Dashboard.tsx` viewer dialog `onOpenChange`: when closing and
  `docText !== openDoc.text`, ask `window.confirm('Discard unsaved changes to
  "<title>"?')` (R333 pattern). Cancel keeps the dialog open with the edits;
  OK closes and discards as before.
- Pristine close paths (no edit, or edits already saved) stay confirmation-free.
- Save changes / signature updates / downloads / Copy text unchanged.

## Non-goals
- No autosave-on-close (downloads intentionally use unsaved docText, R362).
- No custom confirm dialog component; window.confirm matches R333/R344.

## Validation
- Local: tsc, eslint Dashboard.tsx, build.
- Production QA: edit → Esc/X/overlay each shows the confirm; Cancel keeps
  edits and dialog; OK discards (storage byte-identical); pristine close and
  save-then-close show no confirm; rename/R363, downloads, delete/undo,
  375px light/dark, clean baseline.
