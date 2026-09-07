# R426 — honest not-found feedback for bogus ?template deep links

## Production evidence (CDP @1280, https://cv.zalize.com)

- /builder?template=bogus-template-xyz: the resume-state initializer checks
  `TEMPLATES.some((t) => t.id === wanted)` and, on a miss, silently keeps the
  current template — zero feedback, no alert, and the dead `?template` param
  stays in the URL. The landing gallery and 25+ static template pages
  (`scripts/build-seo.mjs`) all deep-link `/builder?template=<slug>`, so a
  renamed/removed template id degrades into a silent no-op. This is the exact
  sibling of R425's dead `?example` gap.

## Scope

- Builder.tsx only: new `templateNotFound` state seeded from the same param
  check; when set, show the R425-style bottom `role=alert` bar ("That template
  wasn't found — it may have been renamed or removed." + Browse templates link
  to /templates/ + Dismiss) and strip only the dead `template` param on mount
  (other params, e.g. a valid `?example`, preserved). Valid-template path and
  the R425 example bars stay byte-identical.

## Validation

- Local: tsc, eslint, build.
- Production QA: bogus slug → alert bar, param stripped (others kept), current
  template and storage untouched, zero console errors; valid slug applies as
  before with no bar; plain /builder unchanged; R425 bars regression; baseline
  byte restore.
