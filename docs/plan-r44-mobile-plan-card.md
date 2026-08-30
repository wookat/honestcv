# R44 — Plan & AI-usage visibility on mobile

Date: 2026-08-30 · Round: R44 · Status: planned

## Evidence

Logged-in mobile (375px) audit of app.rezi.ai (~/audit-r1/shots-r44/):

- `r44-m-rezi-menu.png` — Rezi's mobile hamburger drawer is the *full* workspace
  sidebar: Create new resume, My dashboard, AI Resume Agent, AI Interview,
  Job Search, Sample Library, Review my resume, **plus the plan/usage panel**
  (RESUMES 1/1 · AI GENERATIONS 2/10 · UPGRADE).
- `r44-m-resumes.png` — Rezi's mobile dashboard body also promotes AI Resume
  Agent and Job Search as first-class tiles.
- `r44-m-ours-dashboard.png` — our mobile /dashboard: destinations are covered
  by the hamburger menu (R9/R13/R43), but the R25 "Your plan" panel lives only
  in `WorkspaceNav`, which is hidden below `md`. A phone user has **no way to
  see their plan or remaining free AI credits anywhere in the product**.

## Gap

Plan & AI-usage visibility (R25) is desktop-only. Rezi shows it on mobile in
the drawer. Mobile parity is a hard acceptance criterion (CHARTER).

## Batch (smallest honest slice)

1. Extract the existing "Your plan" card from `WorkspaceNav` into an exported
   `PlanCard` component (same file, same markup/logic — license → plan label /
   Unlimited AI; free → `fetchAiQuota()` remaining credits + Upgrade link).
2. Render `<PlanCard className="md:hidden" />` at the bottom of the /dashboard
   and /jobs page bodies so phones see it; desktop unchanged (sidebar copy).

Notes:
- `GET /api/ai/quota` is idempotent and cheap; the hidden desktop/mobile twin
  means two GETs per page load for free users. Acceptable; no AI credits are
  consumed (quota read ≠ AI call).
- No new storage keys, endpoints, or AI calls.

## Deliberately not doing

- Rezi-style full workspace drawer replacing the site hamburger (R9/R13/R43
  menu already covers all destinations; duplicating nav would add drift risk).
- "Make content. Get paid" promo tile (no such program; would be fake).
- Resume-count limits (we don't cap resumes; showing a cap would be fake).

## QA (production, after deploy)

- 375px /dashboard and /jobs: "Your plan" card visible at page bottom; free
  plan shows real credits matching `GET /api/ai/quota`; Upgrade link ≥40px;
  zero AI-credit consumption; no horizontal overflow.
- 1440px: card appears once (sidebar only), no duplicate.
- Console clean; localStorage restored byte-for-byte; `qa.*` keys removed.
