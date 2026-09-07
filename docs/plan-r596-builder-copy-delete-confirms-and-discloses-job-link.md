# R596 — Builder "Resume copies" Delete is instant, silent, and leaves a tracked job dangling

## Evidence (production, 2026-09-06, bundle `index-zmgvaTzh.js`, real job 2091088, `qa/r596-evidence.cjs`)

Seed: job A tracked, linked to copy `qa-linked`; a plain copy `qa-plain`; standalone draft.
`/builder` → **Copies (2)** → **Delete** on `qa-linked`:

```
before  versions [qa-linked, qa-plain]   pipeline [[2091088, saved, qa-linked]]
click   no confirmation dialog — the copy row simply disappears
after   versions [qa-plain]              pipeline [[2091088, saved, qa-linked]]   ← dangling
status  ['Saved']
```

- No confirmation, no disclosure that the copy is the targeted resume for a tracked application,
  no undo. The same action on `/dashboard` (R586) shows *Delete "X"? — This removes the copy from
  this browser permanently. It's the targeted resume for your tracked … application …; that
  application loses this resume. Its public share link will also be turned off.* with an undo toast.
- The pipeline entry keeps `resumeVersionId: 'qa-linked'`; `/jobs` treats the job as untargeted
  (`linkedVersion` finds no copy), so the user only discovers the loss later.

## Fix (`src/pages/Builder.tsx`)

- `confirmDeleteCopy: ResumeVersion | null` state; the row's **Delete** opens a confirmation
  `Dialog` (stacked on the copies dialog) instead of deleting.
- Description mirrors the dashboard, from live data:
  - always: *This removes the copy from this browser permanently.*
  - `listPipeline().find(e => e.resumeVersionId === v.id)` → *It's the targeted resume for your
    tracked {title} application at {company}; that application loses this resume.*
  - `hasShareLink(v.id)` → *Its public share link will also be turned off.*
  - `v.id === activeVersionId` → *You're editing this copy — the editor keeps its content as a
    plain draft.*
- Confirm runs the existing `deleteResumeVersion` → `revokeShareLinksFor` → `linkVersion(null)`
  sequence. Undo stays a dashboard-only affordance (no toast infrastructure in the builder);
  the dialog says "permanently" so that is honest.

## Acceptance (production, 1280 + 375)

- Delete on the linked copy → dialog with the tracked-job sentence; **Cancel** leaves copies and
  pipeline untouched; **Delete** removes the copy (pipeline unchanged, as today).
- Delete on the plain copy → dialog without the job sentence.
- No page overflow at 375; storage restored; zero console errors; zero AI.
