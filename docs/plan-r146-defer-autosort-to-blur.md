# R146 — Defer auto-sort re-file until the entry card loses focus

## First-hand Rezi evidence (2026-08-31)

- `app.rezi.ai/dashboard/resume/<id>/experience`: each entry is edited in a
  dedicated form with an explicit **"Save to Experience list"** submit button;
  the sidebar Experience list (with the persistent "Sort by date" switch) only
  contains *saved* entries. Typing dates into the form can never re-file
  anything mid-edit because the entry joins/moves in the sorted list only at
  the save boundary.
- RezUp is live-edit (no save button), so R145's re-file-on-every-setResume
  produced the QA-observed UX papercut: with auto-sort on, committing a start
  date on a half-filled new entry re-files the card and the remaining inputs
  jump out from under the cursor (see PR #360 QA comment).

## Gap

Align the *commit boundary*: while the user is editing inside an
Experience/Education entry card, an enabled "Sort by date" toggle should hold
its position; the re-file happens when focus leaves that card (RezUp's closest
equivalent of Rezi's Save).

## Design

- `applyAutoSort(r, isHeld?)` gains an optional predicate; a section whose
  `isHeld(key)` returns true is skipped for this pass.
- Entry card divs get `data-autosort-scope="experience" | "education"`.
- The `setResume` wrapper passes
  `isHeld = (key) => !!document.activeElement?.closest('[data-autosort-scope="<key>"]')`
  — so any state update initiated while focus is inside a card of that section
  leaves that section's order alone.
- Each entry card gets an `onBlurCapture`: when `relatedTarget` is outside the
  card (`!currentTarget.contains(relatedTarget)`), run
  `setResumeRaw((prev) => applyAutoSort(prev))` (no hold check) to re-file now.
- Everything else unchanged: toggle-on still sorts immediately (the button is
  outside the cards), reload normalization, undo/redo, autosave, exports,
  sanitizer, toggle-off freeze.

## Behavior notes

- Typing/committing dates inside a card no longer moves the card; tabbing
  between fields of the same card keeps the hold (relatedTarget check).
- Arrow-move/drag initiated from inside a card defers the snap-back to card
  blur — consistent "commit at boundary" semantics.
- Focus outside any card (keyboard undo on body, ATS fixes, AI applies)
  sorts immediately as in R145.

## Non-goals

- No schema change (reuses `autoSortByDate`), no new deps, no new storage.
- No change to `sortEntriesByDate` semantics or one-shot toggle UX.

## Verification

- Local `npm run lint` + `npm run build` green.
- Production (1440+375): with auto-sort on, fill a new entry including dates —
  card stays put while typing, re-files on clicking/tabbing outside the card;
  toggle-on immediate sort, reload persistence, toggle-off freeze, R145/R144
  regressions.
