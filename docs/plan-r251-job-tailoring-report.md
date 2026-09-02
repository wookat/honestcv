# R251 — Per-job tailoring report in the jobs detail pane

## Rezi evidence (first-party)

- rezi.ai/rezi-changelog (July 30): "Job Tailoring Reports — You can now access
  detailed tailoring reports directly within your job application workflow,
  helping you better understand how your resume aligns with specific roles."
- rezi.ai/job-search: Rezi surfaces which keywords to use so you can see how
  your skills match a posting's requirements.

## Current state

- The /jobs detail pane shows only an opaque percentage: "Targeted copy: N%
  keyword match" (or "N% keyword match with your resume"). Which keywords are
  covered or missing for that specific job is invisible — users must open the
  editor and load the JD to find out.
- `matchScore` (src/lib/ats.ts) already computes coverage internally but
  returns only the rounded percentage; `highPriorityKeywords` (R202) already
  classifies priority.

## Design

`src/lib/ats.ts` — additive helper, `matchScore` untouched:

```ts
export interface MatchReport {
  pct: number
  covered: string[]
  missing: string[]
  highPriorityMissing: string[]
}
export function matchReport(resumeTextRaw: string, jd: string): MatchReport | null
```

Identical matching semantics to `matchScore` (same `extractKeywords`, phrase
substring / token membership, same rounding) so `report.pct ===
matchScore(...)` for every input. `highPriorityMissing` = `missing` ∩
`highPriorityKeywords(jd, keywords)`, order preserved.

`src/pages/Jobs.tsx` — below the detail-pane header line, when a report exists
(targeted copy when linked, else the base resume):

- Disclosure button "Tailoring report" (aria-expanded, session state keyed by
  job id — collapses when switching jobs).
- Expanded: source line ("Against your targeted copy" / "Against your
  resume"), covered count "Covered X of Y job keywords", then
  "High priority missing" amber chips and "Also missing" muted chips
  (each capped at 10 with a static "+N more"), and "All Y keywords covered"
  when nothing is missing.
- The existing "Open targeted resume / Target my resume" button remains the
  action; no new mutations.

## Non-goals

No worker/schema/scoring/AI/dependency changes; no persistence (session
state); `matchScore` callers untouched; ATS panel and interview feedback
untouched.

## Validation

- report.pct equals the displayed match % (targeted and base paths).
- Chip sets equal an oracle run of extractKeywords/highPriorityKeywords.
- Caps at 10 with "+N more"; all-covered and no-JD forms.
- Disclosure resets across job switches; no layout shift regressions.
- 375px wrap, dark contrast, zero AI completions, localStorage baseline.
