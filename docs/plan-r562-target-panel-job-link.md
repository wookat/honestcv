# R562 — Builder Target panel links back to the tracked job on /jobs

## First-hand production evidence (CDP, 1280×900, seeded 1-role draft)
- /jobs?q=react → Tailoring report → target flow → land in /builder with the
  targeted copy active: the ONLY links to /jobs anywhere on the page are the
  header nav items ("Jobs", "Job search"). After acting on missing-keyword
  chips there is no path back to the job the copy was created for — the user
  must re-find it manually to re-check the match % / tailoring report.
- Code confirms: Builder.tsx contains zero `/jobs?job=` links; the pipeline
  entry stores `resumeVersionId` (linkVersion), and /jobs supports the
  `?job=<id>` deep link with fallback (R407/R528).
- Rezi comparison (rezi-changelog Aug 2026, Week 2): "Agent State Updates:
  AI Agent automatically tracks progress based on tailoring completion" —
  tailoring flows keep the job context attached both ways.

## Fix (minimal)
`src/pages/Builder.tsx` only:
- Compute `linkedJob` = pipeline entry whose `resumeVersionId === activeVersionId`
  (via `listPipeline()`, memoized on `activeVersionId`).
- Target job panel: when `linkedJob` exists, render a small muted line above the
  target inputs — Targeting "<title>" at <company> · <Link to=/jobs?job=id>
  View on the jobs board →</Link>.

## Non-goals
No changes to scoring, chips, pipeline persistence, linkVersion semantics,
or the /jobs deep-link behavior.

## Validation
tsc -b, eslint Builder.tsx, build, verify-dist; deploy (known Workers Routes
code 10000 caveat); production QA 1280/375 where deployable: linked copy shows
the line and the link opens the job's detail pane; plain draft shows nothing;
storage restored to six-key baseline.
