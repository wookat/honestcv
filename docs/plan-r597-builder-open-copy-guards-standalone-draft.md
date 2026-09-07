# R597 — Builder "Resume copies" Open guards an unsaved standalone draft

## Production evidence (2026-09-06, index-CFFK4vtn.js, qa/r597-evidence.cjs)

Seed: `activeVersionId = null`, draft with content (`summary = "STANDALONE DRAFT — never saved as a copy"`), two saved copies.

```
/builder → Copies → Open "Google — SWE II"
before  draft "STANDALONE DRAFT — never saved as a copy"  active null
click   → no dialog
after   draft "Saved copy content"                          active qa-copy
```

The standalone draft is gone. The only warning is a passive footnote at the bottom of
the copies dialog ("Opening a copy replaces what's in the editor — save the current
resume as a copy first if you want to keep it."), which nothing forces the user to read
before the destructive click. The same action on `/dashboard` (Open on a card while a
non-synced draft exists) and on `/jobs` (R595) confirms and offers *Save draft as copy,
then open*. Builder — where the user is actually typing — is the one surface that does
not.

## Scope

Only when all three hold: `activeVersionId === null` (editor is a standalone draft),
`resumeHasContent(resume)` (lib matcher, same as R595), and the user clicks **Open** on a
copy. Synced drafts (active copy set) and empty drafts keep the direct one-click open.

## Design (`src/pages/Builder.tsx`)

- `confirmOpenCopy: ResumeVersion | null`; `openCopy(v)` extracts the existing
  `linkVersion → setResume → close dialog` sequence.
- Row **Open** → `activeVersionId === null && draftHasContent(resume) ? setConfirmOpenCopy(v) : openCopy(v)`.
- Stacked dialog:
  ```
  Open "{name}"?
  This replaces what's currently in the editor. Your current resume isn't saved as a copy,
  so save it first if you want to keep it.
  [Cancel] [Save draft as copy, then open] [Open and replace draft]
  ```
- *Save draft as copy, then open* = `saveResumeVersion(targetRole || fullName || 'Untitled copy', resume)`
  through `applyVersions` (storage-full → alert, copy not opened) then `openCopy(v)`.

## Acceptance

- Standalone draft + Open → dialog; *Open and replace draft* → copy opened, draft replaced (explicit).
- *Save draft as copy, then open* → new copy holding the draft appears in the list, then the target copy opens.
- Synced draft (active copy set) + Open another copy → no dialog, direct open (unchanged).
- 375px: no page overflow; storage restored; 0 console errors; zero AI.
