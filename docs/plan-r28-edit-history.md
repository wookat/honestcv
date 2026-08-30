# R28 — Automatic edit history in the builder ("Version history")

Date: 2026-08-29 · Round: R28 · Status: planned

## Firsthand evidence (Rezi, logged-in audit 2026-08-29)

Captured at 1440×900 into `~/audit-r1/shots-r28/` (r28-ed-exp2, r28-vh-section):

- Rezi's resume editor sidebar shows a **" Version History (beta)"** block — a
  vertical timeline of automatic snapshots labelled with relative timestamps
  ("10 hours ago", three entries after one editing session). Entries are
  timeline nodes the user can open to go back to an earlier state.
- These snapshots are created by the app itself while editing — the user never
  pressed a "save version" button (our audit account only typed content).
- Also re-confirmed as already covered on our side (no action): Finish Up
  toolbar (font/size/line height/spacing/indent/divider/paper size/color —
  RezUp has all shipped R7/R15/R18 + paper size/accent), AI Keyword Targeting
  panel (RezUp R1 keyword coverage + keyword-bullet dialog), per-section
  best-practice warnings (RezUp `guidance.ts` bullet checks), Expert Review
  (paid human review — business-model gap, deliberately not copied).

## Gap

RezUp's `/builder` autosaves the single draft (`honestcv.resume`) with a 400 ms
debounce and offers manual named versions (`honestcv.resumeVersions`, R5) plus
one-shot Ctrl+Z undo. But there is **no automatic history**: an accidental
paste-over, a bad AI apply followed by more edits, or an import overwrite can
silently destroy hours of work with no way back once undo is stale. Rezi
protects users from this with automatic Version History. Priority: P1
(workhorse-safety feature in the core workspace).

## Architecture decision

Local-first, zero backend, zero AI:

- New localStorage key `honestcv.resumeHistory`: `ResumeSnapshot[]`
  (`{ id, at, data }`), newest first, capped at 15 snapshots (~a few hundred
  KB worst case, well inside localStorage limits; oldest dropped).
- Checkpoint policy: on every debounced draft save, record a snapshot only if
  (a) the newest snapshot is older than 10 minutes and (b) content differs
  from the newest snapshot (JSON compare). So a continuous editing session
  produces one checkpoint per ~10 min, and idle time costs nothing.
- Restore policy: restoring first force-records the current draft as a
  checkpoint (dedup identical), then replaces the draft — restore is always
  reversible.
- Deliberately NOT copied: cloud-persisted history, cross-device history,
  diff view. Manual named versions stay the tool for per-job tailoring.

## UI spec

- Header action bar in `/builder`: new ghost icon button (History clock icon,
  title "Edit history") next to Undo.
- Opens a dialog "Edit history": explainer line, list of snapshots — each row
  shows relative time ("10 minutes ago", "3 hours ago", "2 days ago"), the
  snapshot's name/target role, and a Restore button.
- Empty state: "No checkpoints yet — the builder saves one automatically about
  every 10 minutes while you edit."
- Restore: closes dialog, draft replaced, current draft checkpointed first.
- Mobile 375px: dialog scrollable, rows and Restore buttons ≥40px, no
  horizontal overflow.

## Validation

- `npm run lint`, `npx tsc -b`, `npm run build` all green locally.
- Production QA (desktop 1440 + 375px): edit → checkpoint appears after the
  10-minute gap rule (QA may pre-seed `honestcv.resumeHistory` to test list
  rendering + restore without waiting), restore swaps the draft and records a
  checkpoint of the pre-restore draft, cap respected, localStorage backed up
  and restored byte-for-byte, console clean.
