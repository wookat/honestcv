# R560 — honest hint when the resume is empty on the /jobs detail pane

## First-hand production evidence (2026-08-31, cv.zalize.com)

Probe: 1280×900, clean six-key storage baseline (no `honestcv.resume`),
`/jobs?q=react` → select "Senior React Full-stack Developer".

Observed detail pane:

- header shows title/company/location only — **no** "% keyword match" span;
- **no** "Tailoring report" toggle anywhere in the pane;
- "Target my resume" button is present but nothing explains what matching
  against a resume would even show.

With a seeded resume the same pane shows "N% keyword match with your resume"
plus the expandable Tailoring report (R251/R559). A brand-new user browsing
jobs never learns the matching feature exists or why it is absent.

Code confirmation (`src/pages/Jobs.tsx`):

- `matchOf` returns an empty map when `!resumeText.trim()` (line ~310);
- `selectedReport` returns `null` when the draft text is empty (line ~488);
- the report toggle renders only when `selectedReport` is truthy (line ~1385),
  so the whole affordance silently disappears.

## Rezi comparison

Rezi surfaces job match scores prominently ("Instant Job Match Scores",
Aug 2026 changelog) and prompts resume creation when none exists. Silent
absence of the whole matching surface is not competitive or honest.

## Smallest useful fix

In the detail pane, when a job is selected and `!resumeText.trim()` and the
job has no targeted copy, render a muted hint in the slot where the report
toggle would appear:

```tsx
{!selectedReport && !resumeText.trim() && !tailoredMatchOf.has(selected.id) && (
  <p className="text-muted-foreground mt-2 text-xs">
    <Link to="/builder" className="text-primary underline-offset-2 hover:underline">
      Add your resume
    </Link>{' '}
    to see how it matches this job's keywords.
  </p>
)}
```

No changes to scoring, extraction, pipeline persistence, or the report
itself. Non-empty drafts render exactly as before.

## Validation

- `npx tsc -b && npx eslint src/pages/Jobs.tsx && npm run build && npm run verify-dist`
- Deploy attempt (`npx wrangler deploy`; Workers Routes auth code 10000 expected).
- Production QA: 1280 + 375, clean baseline → hint visible and links to
  /builder; seed a draft → hint gone, match % + report restored (R559
  expander regression); zero overflow, zero console errors; storage back to
  baseline.
