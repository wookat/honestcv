# R153 — "Learn more" guide links on every Score breakdown dimension

## First-hand Rezi observation (2026-08-31, app.rezi.ai finish-up score modal)

- Every failed check row in the Rezi Score modal carries a small "learn more"
  icon linking to a public Rezi doc or blog post explaining that rule
  (e.g. weak bullets → rezi.ai/posts/resume-work-experience, page length →
  rezi.ai/posts/one-page-resume, bullet count / word count / skills format /
  missing dates → rezi.ai/rezi-docs/the-rezi-score-explained etc.).
- The modal also shows category tabs (Content/Format/Optimization/Best
  Practices/Application Ready) and "How You Compare" percentile — the
  percentile stays deliberately-not-done (no real data), and our six writing
  dimensions + two ATS dimensions already play the category role.

## RezUp gap

Our Score breakdown dialog (HealthDialog) has per-dimension score bars,
summaries, plain-language "why", findings, and Fix → jumps (R150/R152), but no
educational deep-dive — even though we already ship 40+ SEO guides under
/guides that cover exactly these rules.

## Design

Map each dimension id to an existing guide route and render a "Learn more"
link next to the dimension label in HealthDialog (opens in a new tab,
`target="_blank" rel="noopener"`):

| dimension | guide |
|---|---|
| keywords | /guides/resume-keywords |
| ats-structure | /guides/ats-friendly-resume |
| quantification | /guides/resume-bullet-points |
| verbs | /guides/resume-action-verbs |
| brevity | /guides/how-long-should-a-resume-be |
| buzzwords | /guides/common-resume-mistakes |
| consistency | /guides/best-resume-format |
| completeness | /guides/best-resume-format |

- Constant map inside Builder.tsx (UI concern; guidance.ts stays pure rules).
- Link: BookOpen icon + "Guide", `aria-label` "Read the {label} guide — opens
  in a new tab", min-h-10 sm:min-h-0 touch target, text-xs underline like the
  Fix → affordance.
- Shown on every dimension regardless of score (education is useful even when
  passing), placed after the Fix → button.
- Guides are prerendered static routes served by the same Worker — no new
  deps, schema, storage, or network calls; dialog stays local-only.

## Acceptance

- 1600: each of the 8 dimensions shows a Guide link; clicking opens the right
  guide in a new tab; Fix → behavior unchanged.
- 375: links tappable (≥40px), dialog scroll/overflow unchanged.
- Regression: R152 score chip opens the dialog; ATS Fix → jumps still work.
