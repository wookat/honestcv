# R328 — SOP-10 four-dimension gap audit vs Rezi (console / depth / landing / architecture)

Cadence node (last SOP-10: R318). First-hand Rezi evidence: changelog 2026-08
(Weeks 1–4) — agent state tracking on tailoring completion, refreshed agent
interface, large-screen layouts, "updated at" integrity, location autocomplete,
refresh-without-losing-place. Our side has since landed R319–R327 (variant
feedback, delete undo, cross-tab notice, inline editing fixes, URL state on
/jobs /samples /documents, interview coaching filter, AI-chain audit).

## Audit scope (production, zero real AI, fresh angles vs R318)

1. 操作台 (console): full organization loop under the new features — folders +
   duplicate + targeted copies + R320 delete/undo interplay; /documents R326
   kind filter + R305 examples + R304 signatures coexisting; WorkspaceNav
   active states across all five routes; R197 timestamp integrity spot check.
2. 功能深度 (depth): the tailoring golden path end-to-end — save job →
   targeted copy → tailor → tailoring report → keyword triage → R256/R325
   interview bridge → back; assistant tailoring status (R252) vs Rezi "agent
   state updates"; auto-fit + margins + language combo export sanity.
3. 落地页 (landing/public): Lighthouse on `/`, /cover-letter-examples/,
   /resignation-letter-examples/, /interview-prep/ (a11y/bp/SEO ≥ previous
   1.0 baselines); nav/footer link integrity (R307 slashed); 375/768/1920.
4. 架构 (architecture): console error/warn noise on all SPA routes (incl. new
   bundle index-K-Eo0Uxr.js), sitemap sample, /api/health, 404 page, share
   create/view/revoke happy path, localStorage schema keys unchanged.

## Exit criteria

Zero P0–P2 → docs-only round with gap list for R329+; P0/P1 fixed in-round.
