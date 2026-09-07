# R521 — warn before the tab unloads with unsaved editor work

## First-hand production evidence (cv.zalize.com, fresh storage, CDP)

1. Seeded one career document, opened it via `/documents?doc=qa-r521`, clicked
   **Edit**, typed an extra line, then hard-refreshed the page. Result: the edit
   was silently gone (`edit survived refresh: False`) — no browser prompt, no
   in-app notice.
2. The in-app close paths ARE guarded: pressing Escape on the same dirty dialog
   shows the R364/R405 "discard" confirmation (`discard confirm after Escape:
   True`). Only the browser-level exits (refresh, tab close, window close,
   external navigation) bypass every guard.
3. `rg beforeunload src/` → zero matches. No surface in the app registers a
   `beforeunload` handler, so the same silent loss applies to the Builder tool
   dialog (edited cover/resignation letters and interview prep briefs — the
   exact work R333/R508–R511 added in-app confirmations for).

## Why this matters

Users write letters and prep briefs in these dialogs for many minutes. Every
in-app destructive path now confirms first, but an accidental Ctrl+R, tab
close, or clicking a bookmarked link destroys the same work with zero warning.
The standard, honest browser affordance for this is a `beforeunload` prompt
while (and only while) unsaved work exists.

## Fix (smallest useful change)

Two `useEffect` hooks, one per dirty surface, both registering `beforeunload`
only while dirty so normal navigation is never nagged:

- `Dashboard.tsx` document viewer: dirty = `openDoc !== null && docText !==
  openDoc.text` (the same predicate the existing close confirmation uses).
- `Builder.tsx` ToolDialog: dirty = existing `unsavedWork` predicate.

Handler: `e.preventDefault()` (plus legacy `returnValue` assignment for older
browsers). The browser shows its own generic leave prompt; no custom text is
possible or needed.

## Non-goals

- No autosave/draft persistence change (sessionStorage drafts for these
  dialogs would be a bigger design; the Builder resume itself already
  autosaves).
- No prompt when nothing is dirty; no prompt on SPA navigation (in-app paths
  already have styled confirmations).

## Verification

- Local: `npx tsc -b`, eslint on the two files, `npm run build`,
  `npm run verify-dist`.
- Production QA: dirty document editor → reload via CDP `Page.reload` must
  surface a beforeunload dialog (observed via `Page.javascriptDialogOpening`);
  clean editor → no dialog; same pair for the Builder letter dialog; 375px
  overflow check; storage cleaned after QA.
