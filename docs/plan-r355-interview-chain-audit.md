# R355 — interview preparation chain production audit (exploratory)

## Why this surface
- Rezi changelog still shows 2026-08 Week 4 — no new public surface to chase this round.
- The interview chain has accumulated many features across R107 (practice sessions), R201 (instant local answer analysis), R233–R236 (timed answers, pace, quick-filler, filler sounds, tone), R250 (high-priority vs remaining keywords in feedback), R256 (answer keywords → resume bridge), R257 (instant local questions), R258 (session feedback report), R325 (skill-word coaching) — but has never had a dedicated end-to-end production audit (R353 covered letters/documents; R339 covered jobs/design tools).
- R333 added the tool-dialog discard confirm specifically because in-progress interview sessions are the most expensive typed state in the app — worth re-proving the full chain.

## Scope (production cv.zalize.com, all /api/ai/* mocked pre-dispatch, zero real AI)
1. Entry points: Builder toolbar Interview Prep dialog; instant local questions without AI (R257) vs AI question payloads (mocked) — payload fields, JD/role propagation.
2. Practice session: timed answers, pace/speaking time (R233), quick-filler frequency/placement/rate (R234), filler sounds (R235), tone proxy (R236) — deterministic local metrics with crafted answers.
3. Instant local answer analysis (R201) and skill-word coaching (R325): STAR/keyword feedback correctness on a crafted answer, no title/filler words suggested.
4. AI interview feedback payload (mocked) incl. high-priority vs remaining keyword tiers (R250).
5. Session finish report (R258): metrics summary, per-question recap; keywords-to-add-to-resume bridge (R256) applies to the resume.
6. Guards & regressions: R333 discard confirm on in-progress session (Esc/overlay/X + Cancel state preservation), R340 focus return, interview brief payload (no language by design — R354 non-goal).
7. Responsive/dark: strict 375 overflow in question/answer/report states, dark mode, zero app console errors, exact baseline restore.

## Deliverable
- Fix P0–P2 (and cheap in-scope P3) findings in-round; otherwise docs-only PR (plan + handoff + skill notes), consistent with R339/R353.

## Audit result (production, zero real AI) — all chain checks green, two P3s in the R256 bridge, both fixed in-round
1. P3 — "Open keyword targeting →" bypassed the R333 discard confirm: it called `onJumpToTarget` directly, while Esc/overlay/X went through `requestClose`. Fix: extract `confirmDiscard()` from `requestClose` and gate the bridge click with it — same message, Cancel keeps the session intact.
2. P3 — the bridge's jump overshot to the page bottom (targeting panel 1,200–2,500px above the viewport): `jumpToSection('target')` ran one rAF after `setToolOpen(null)`, while the Radix dialog was still unmounting and holding its body scroll lock, so the smooth scroll targeted a mid-transition layout. Fix: delay the jump 250ms until the dialog has unmounted and released the lock.
- Observed, not filed: "product" can appear in high-priority keywords despite being half the job title (single-word title filtering); R340 focus return passed in the controlled flow.
