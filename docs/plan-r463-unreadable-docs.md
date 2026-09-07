# R463 — back up an unreadable career-documents list instead of silently destroying it

## Production evidence (first-hand, CDP against https://cv.zalize.com)

SOP-10 four-dimension sweep first: 7 SPA routes re-scanned (title/h1/single
main/overflow/console errors) — all clean. Verified defect below is the chosen
gap.

Reproduction (`~/audit-r1/r463_docs.py`, `r463_docs2.py`):

1. Plant a truncated JSON value in `localStorage['honestcv.careerDocs']`
   (`[{"id":"d1","kind":"cover","title":"My cover letter","text":"Dear`).
2. Load `/documents` — the list renders empty, zero alerts, the corrupt raw
   value is still intact (read path alone does not destroy).
3. Open a letter example → "Use this example" (a plain local write via
   `saveCareerDoc`) — the corrupt value is replaced by the rebuilt one-item
   list. The user's entire saved-letters history (cover letters, resignation
   letters, interview briefs — user-authored content) is destroyed with **no
   warning and no backup**.

Any other write does the same: import a cover letter, save from the Builder
document dialog, rename/duplicate/delete/restore — all funnel through
`persistDocs()`.

This is the third face of the same family: R461 protected the resume draft
(`honestcv.resume`), R462 protected the saved-copies list
(`honestcv.resumeVersions`). Entry-level corruption inside a *readable* array
is already handled by `sanitizeCareerDoc` per-entry filtering (R402) — this
round covers only the wholly unreadable value (bad JSON / non-array).

## Rejected alternatives

- **JSON auto-repair** — guessing at truncated user content risks fabricating
  documents; rejected as in R461/R462.
- **Blocking writes while the value is unreadable** — leaves the feature
  unusable; the app should keep working on a fresh list once the original is
  safe.

## Fix (smallest focused change)

`src/lib/documents.ts`:
- `stashUnreadableDocs()`: when `honestcv.careerDocs` exists but does not
  parse to an array, copy the raw bytes to `honestcv.careerDocs.unreadable`
  (never overwriting an existing backup) and return `true`.
- `persistDocs()` calls the stash first, so *every* write path preserves the
  unreadable value before overwriting — regardless of which surface (Dashboard
  tools, Builder document dialog, import, examples) triggered the write.

`src/pages/Dashboard.tsx`:
- `docsUnreadable` state initializer runs the stash on mount and drives a
  dismissible `role="alert"` card under the Career documents heading:
  "Your saved documents couldn't be read, so the list started fresh. The
  unreadable copy was kept in your browser storage as a backup."

Readable arrays and missing keys are untouched: no card, no backup key.

## QA scenarios

1. Corrupt `honestcv.careerDocs` → `/documents` shows the exact warning card
   and `honestcv.careerDocs.unreadable` holds the original raw bytes.
2. Write-site protection: in a fresh document that never visits `/documents`,
   a Builder/document write backs up the corrupt bytes before writing.
3. An existing backup is never overwritten.
4. Dismiss only hides the card; both keys untouched.
5. Valid array / missing key → no card, no backup.
6. R461/R462 regressions intact.
7. 375px light/dark, no overflow, no console errors, no unsafe traffic,
   byte-exact storage restore.
