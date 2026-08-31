# R113 — Summary library: save a polished summary once, reuse it across resume copies

## First-hand evidence (2026-08-29)

- Rezi resume editor, Summary tab (`~/audit-r1/shots-r112/summary.png|.txt`): the summary
  editor has a first-class **"SAVE SUMMARY INFO"** action, the same save-for-reuse
  pattern as "SAVE TO EXPERIENCE LIST" (R99), "SAVE TO EDUCATION LIST" (R111) and
  "SAVE TO SKILLS LIST" (R112).
- Our Summary section — a single textarea with the R29 "Draft from my resume" / AI
  polish actions — has no way to reuse a polished summary in another resume copy. A
  summary is the most rewritten section when tailoring per job, so keeping a couple of
  polished variants and swapping them in is exactly the library use case.

## Design

Mirror the R112 skills-library pattern 1:1 (a summary is also one text block):

- `resume.ts`:
  - `interface SavedSummary { id: string; savedAt: number; summary: string }`
  - new localStorage key `honestcv.summaryLibrary`, max 30, newest first
  - `listSummaryLibrary()`, `saveSummaryToLibrary(summary)`, `deleteLibrarySummary(id)`
  - same sanitization: rows missing `id`/numeric `savedAt` or with blank/non-string
    `summary` are silently dropped; malformed JSON and storage failures ignored
- `Builder.tsx` Summary section:
  - BookmarkPlus "Save summary to library" button next to the AI button (disabled when
    blank; green check flash 1.6 s)
  - "From library (n)" toggle hidden when the library is empty; rows show the first
    line truncated + saved date, with Insert / Delete (h-10 mobile / sm:h-7 desktop)
  - Insert appends with a newline when the current summary is non-empty (no data
    loss), verbatim set when empty — identical semantics to R112

Non-goals: no schema/AI/scoring/export changes; no auto-replace of the current
summary; no cross-device sync.
