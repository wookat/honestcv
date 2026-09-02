# R253 QA plan — navigation attention badge for stale applications

Code evidence: src/lib/jobs.ts:62–67 `staleDays` (applied/interviewing only, last timeline step, `Math.floor(days) >= 7`), :70–72 `attentionCount(pipeline = listPipeline())`; src/components/WorkspaceNav.tsx:89 `attention: attentionCount()` (useMemo on mount), :136–144 amber pill `bg-amber-100 … text-amber-800 tabular-nums` with title/aria-label "N tracked application(s) with no status update in 7+ days", rendered BEFORE the muted total count (:145–147); src/components/Layout.tsx:105–116 `JobsAttentionBadge` (same classes/labels, null at 0), :120 `useState(() => attentionCount())` on SiteHeader mount, :134–136 desktop nav Jobs link, :161–163 mobile hamburger Jobs link. Bundles: index-Df85OPNN.js / WorkspaceNav-Clp50xTZ.js / Jobs-CIQUw4-O.js.

Method: production via CDP (suppress_origin=True, helper /home/ubuntu/audit-r1/cdp.py); deterministic `honestcv.jobPipeline` fixture; tsx oracle `npx tsx --tsconfig tsconfig.app.json` importing `attentionCount`/`staleDays` from src/lib/jobs.ts with the same fixture and pinned `now`; fetch counter asserts zero /api/ai/* (baseline GET /api/ai/quota allowed — note PlanCard fires it on workspace pages); screenshots r253_*; recording known down (attempt once).

Fixture (6 entries, jobs need type+category+tags-optional; `at` computed from Date.now()):
- f1 applied, last step 6d − 1h old → NOT counted (floor 5? no: 6d−? use exactly 6d+1h → floor 6 <7, not counted)
- f2 applied, last step 7d + 1h old → counted (floor 7)
- f3 interviewing, last step 8d + 1h old → counted
- f4 saved, 10d old → never counted
- f5 offer, 10d old → never counted
- f6 rejected, 10d old → never counted
Expected attentionCount = 2 (oracle must agree).

## C0 Bundles
index-Df85OPNN.js entry; WorkspaceNav-Clp50xTZ.js and Jobs-CIQUw4-O.js chunks load on /dashboard and /jobs.

## C1 Oracle + sidebar badge (desktop /dashboard, 1600×900)
Seed fixture → /dashboard. Workspace sidebar "Job search" row shows amber pill text "2" with title AND aria-label exactly "2 tracked applications with no status update in 7+ days", followed (after) by muted total "6". Pill classes contain bg-amber-100 and text-amber-800. Oracle attentionCount(fixture) === 2. Screenshot.

## C2 Header badge (desktop)
Same seed, any SiteHeader page (/, or /ats-checker): desktop nav "Jobs" link contains the amber badge "2" with same title/aria-label. Screenshot.

## C3 Mobile hamburger (375×812)
Open hamburger (button aria-label "Menu") → menu "Jobs" link shows badge "2". scrollWidth === 375 with menu open. Screenshot.

## C4 Absence + singular
(a) Empty pipeline → no badge in sidebar or header; no muted total either. (b) Fresh-only pipeline (f1 6d + f4/f5/f6) → no badge anywhere but muted total "4" still shows in sidebar. (c) Single stale entry (f2 only) → badge "1" with singular label "1 tracked application with no status update in 7+ days".

## C5 /jobs equivalence after helper move (regression)
Full fixture on /jobs Tracked tab: f2 row chip "No update · 7d", f3 chip "No update · 8d", f1/f4/f5/f6 no chip; open f3 detail → "No update in 8 days — consider following up." Screenshot.

## C6 375px overflow + contrast
375×812 /dashboard is sidebar-hidden (md:block) — overflow check done on header + hamburger (C3). Contrast: rendered-pixel (3× crop, 2/98 percentile) of the sidebar badge in light AND dark (UI theme cycle; badge uses base tokens only — inverted palette expects light amber text on dark amber bg like R251 fix, ≥4.5:1). Screenshots + crops.

## C7 Zero AI + cleanup
__aiReqs [] throughout (quota-only baseline). Remove honestcv.jobPipeline/theme etc.; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Results appended below.

## Results (executed against production, bundles index-Df85OPNN.js / WorkspaceNav-Clp50xTZ.js / Jobs-CIQUw4-O.js)
- C0 bundles live: entry index-Df85OPNN.js; WorkspaceNav-Clp50xTZ.js loaded on /dashboard; Jobs-CIQUw4-O.js on /jobs — passed
- Oracle (tsx, same fixture): staleDays [null,7,8,null,null,null], attentionCount 2 — matches all UI counts below
- C1 sidebar (/dashboard, 1600×900): "Job search" row shows amber pill "2", classes `rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 tabular-nums`, title AND aria-label exactly "2 tracked applications with no status update in 7+ days", rendered BEFORE the muted total "6" (compareDocumentPosition confirmed) — passed
- C2 desktop header (/ats-checker): nav "Jobs 2" with identical badge title/aria — passed
- C3 mobile 375×812: hamburger (aria-label "Menu") → menu "Jobs 2" badge with same title; scrollWidth === 375 with menu open — passed
- C4a empty pipeline: no badge, no muted total, no header badge — passed
- C4b fresh-only (6d applied + saved/offer/rejected 10d): no badge anywhere; muted total "4" still shown — passed
- C4c single stale: badge "1", singular title "1 tracked application with no status update in 7+ days"; header badge "1" — passed
- C5 /jobs regression after staleDays move: Tracked tab chips exactly {Data Engineer: "No update · 7d", Platform Engineer: "No update · 8d"}, none on 6d/saved/offer/rejected rows; f3 detail "No update in 8 days — consider following up." — passed
- C6 contrast (rendered-pixel, 4× crop): light badge 6.9:1; dark badge 13.57:1 (computed text oklch(0.88 .11 88) on bg oklch(0.33 .07 80) — inverted palette works with base tokens, per R251 finding) — passed
- C7 zero /api/ai/* completions throughout (__aiReqs [] at every stage; quota baseline only); cleanup: final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme — done
