# R174 — Rezi-style resume length meter with actionable advice

## First-hand Rezi evidence (2026-08-31, app.rezi.ai Finish Up)
- The Rezi Score panel reports fractional resume length as an actionable finding:
  "Your resume is 0.31 page long" with the explanation "One page is sufficient to
  include enough relevant experiences for any targeted application."
- Rezi treats *too-short* resumes as a scoring problem, not just multi-page ones —
  the check is a length measurement of the rendered document, not a word count.

## RezUp today
- `usePdfPageCount` (src/pages/Builder.tsx) shows only the integer PDF page count
  ("PDF export: 1 page") and warns only when the count exceeds one page.
- A resume filling 10% of a page and one filling 95% both read "1 page" with no
  feedback, so under-filled resumes get no signal at all.
- `countResumePdfPages` (src/lib/pdf.ts) discards the writer's final cursor
  position, which is exactly what is needed for a fractional measurement.

## Gap
No feedback on how *full* the resume is. Rezi surfaces fractional page length and
flags sparse resumes; RezUp cannot distinguish a nearly-empty page from a full one.

## Scope
1. `src/lib/pdf.ts`: split `composeResumePdf` so the writer is observable; export
   `measureResumePdf(resume): Promise<{ pages, length }>` where
   `length = (pages - 1) + fill-of-last-page` computed from the writer's final `y`
   against the usable content height. `countResumePdfPages` delegates to it.
2. `src/pages/Builder.tsx`: upgrade `usePdfPageCount` to `usePdfLength`; the page
   indicator row shows "Resume length: X.XX pages" plus a small fill bar and
   tiered advice (copy self-written, thresholds mirror the existing amber style):
   - `pages > 1`: existing amber "recruiters prefer one page…" advice unchanged.
   - `pages === 1 && length < 0.45`: amber "looks sparse — add relevant bullets
     or roles to fill most of the page".
   - otherwise: neutral "one page is ideal for most applications".
3. Auto-fit button, debounce, and all export paths unchanged.

## Non-goals
- No change to scoring math in guidance.ts/ats.ts (the meter is advisory UI, like
  Rezi's; wiring async PDF measurement into the sync health model is out of scope).
- No new storage, schema, or server changes; measurement is derived per render.

## Acceptance
- Local lint + typecheck + build green.
- 1440px and 375px: meter row visible on the preview pane with no overflow.
- Sparse resume (1–2 bullets) shows amber sparse advice; full one-page resume
  shows neutral copy; 2-page resume keeps the existing trim advice.
- Fractional length tracks content (adding bullets raises it, page 2 crosses 1.0).
- Production deploy per stacked-round flow (branch already contains #387–#389);
  smoke prior-round markers (R171 folders, R172 Saved chip, R173 letter preview)
  before QA of the new meter.
