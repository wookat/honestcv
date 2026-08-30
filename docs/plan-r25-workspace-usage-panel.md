# R25 — Workspace sidebar: plan & AI-usage panel (Rezi parity)

Date: 2026-08-29 · Round: R25 · Prior: R24 (#237)

## First-hand evidence (2026-08-29 logged-in capture `~/audit-r1/shots-r25/`)

Rezi's persistent left sidebar (visible on resumes/review pages) ends with a
usage block:

```text
PRO
RESUMES   1 / 1
AI GENERATIONS   1 / 10
UPGRADE
```

— plan badge, live usage meters, and an always-visible upgrade path inside the
workspace.

RezUp today: `WorkspaceNav` (R21) shows destinations + counts only. The free-AI
quota is fetched (`GET /api/ai/quota`, read-only) but surfaced *only* inside
Builder after an AI call; the workspace has no plan state and no upgrade path.
Gap class: 操作台 P2 + 变现路径 P1 (upgrade CTA is buried on the landing page).

## Scope (this batch)

`src/components/WorkspaceNav.tsx` only — a "Your plan" card under the nav:

- Plan line: `Free plan` / `Resume plan` / `Bundle plan` from `loadLicense()`
  (client-side; no new endpoints).
- Free users: "Free AI credits left: N" (quota window is 30 days server-side,
  so no "today" wording) from existing read-only
  `fetchAiQuota()` (null → row hidden, e.g. network error); plus an
  `Upgrade` link to `/pricing/`. Licensed users: "Unlimited AI" line,
  no upgrade CTA.
- Fetch once on mount; no polling. Errors degrade to hiding the meter — never
  block the nav.

Honesty rules: numbers come from the real quota endpoint (never invented);
no fake "resumes 1/1" meter — our resumes are local and uncapped, so we do not
copy that line.

## Acceptance

- Desktop (md+): panel visible on /dashboard and /jobs; quota number matches
  `GET /api/ai/quota` for the client; Upgrade links to /pricing/.
- Licensed state (QA via injected `honestcv.license`): plan name shown,
  no Upgrade CTA.
- No new Worker routes, storage keys, or schema changes.
- Mobile: WorkspaceNav stays hidden (<md) — unchanged.
- lint/tsc/build green locally.
