# QA plan — R265 local "Improve my ATS score" assistant reply (production: cv.zalize.com)

Bundles: index-oRxG6B-k.js / Builder-26J7yCTh.js / guidance-RklzEE_S.js.

Code evidence: src/lib/guidance.ts:380–422 `priorityFixes(ats, health, limit=5)`
(failing structure checks at 30/len or 100/len pts; missing-keywords fix; health
dimensions <80 weighted; sort by points desc, top 5); :428–446 `improveScoreReply`
(fixes form: "Your ATS score is N/100. Highest-impact fixes first:\n1. <text>
(~<pts> pts, <impact> impact)…\n\nApply a fix and your score updates instantly.
The Score breakdown has one-click jumps to each spot."; no-fix + JD: "…no priority
fixes right now. Nice work — ask me anything you’d like to sharpen."; no-fix no-JD:
"…Add a job description in the Target job panel and I can point out missing
keywords too."). AssistantPanel.tsx:84–86 label/prompt; :218–236 improveScore local
path (no fetch) + runQuickTask routing; :352–363 empty-state buttons; :459–471 pill
row; :276–285 Clear chat; Builder.tsx:1103 `?assistant=1` opens panel;
:1464/6784 fixes = priorityFixes(ats, resumeHealth(shown)); :9251+ Score breakdown
dialog renders the same priorityFixes list.

## Checks (fixture: seeded resume with JD so fixes non-empty; oracle = tsx script
recomputing improveScoreReply(scoreResume(...).score, priorityFixes(...), hasJd)
from the same fixture via relative imports in .tmp-smoke)

- L0 all three bundles in resource entries; oracle script runs clean.
- L1 empty-state click "Improve my ATS score": user bubble byte-exact
  "How can I improve my resume’s ATS score? Give me the highest-impact fixes first.";
  assistant bubble byte-exact equals oracle reply (score + numbered fixes + footer);
  instrumented fetch log shows ZERO /api/ai/* calls for the click (baseline
  GET /api/ai/quota only, quota counter unchanged).
- L2 reply's numbered fix texts equal the Score breakdown dialog "Priority fixes"
  list (same texts, same order, ≤5).
- L3 with chat non-empty, click the pill-row "Improve my ATS score" → second local
  Q/A appended, again byte-exact vs oracle, no /api/ai/* call.
- L4 edit resume so a fix resolves (e.g. add missing keywords/summary) → click again
  → new reply reflects new score and fix list (byte-exact vs re-run oracle; differs
  from L1 reply).
- L5 no-JD fixture → reply uses fixes form w/ structure-only points (or, with all
  fixes resolved, the no-fix no-JD sentence); no-fix + JD form byte-checked via
  oracle if not reachable in UI (disclose).
- L6 regression: "Find matching jobs" still local (reply + jobs link to /jobs, no
  /api/ai/*); "Draft my summary" DOES attempt /api/ai (request observed; 402/quota
  acceptable); Clear chat empties honestcv.assistantChat; chat persists across
  panel close/reopen.
- L7 375×812 with panel open: scrollWidth === 375.
- L8 assistant bubble text rendered-pixel contrast light + dark ≥4.5:1.
- L9 zero non-quota /api/ai/* calls across local-path clicks; cleanup localStorage
  to exactly ["honestcv.clientId","honestcv.qa"] (incl. removing
  honestcv.assistantChat), light theme; remove .tmp-smoke/r265 oracle copy.

## Results (appended after production run)

## Results (production run, 2025-09-02)

Fixture: Frontend fixture (name/email/location, targetRole "Frontend Engineer", summary, 1 experience with 2 bullets, skills "JavaScript, HTML, CSS", JD with React/TypeScript/GraphQL/Docker/Kubernetes/CI-CD/AWS). Oracle: temporary copy `.tmp-smoke/r265_fixture_oracle.ts` (relative imports, pages=1 matching live "Resume length: 0.34 page"), deleted after run. Lead's `.tmp-smoke/r265_oracle.ts` re-run: ALL PASS (incl. both no-fix forms byte-exact).

- L0 bundles index-oRxG6B-k.js / Builder-26J7yCTh.js / guidance-RklzEE_S.js all in resource entries — PASS
- L1 empty-state "Improve my ATS score": user bubble byte-exact prompt; assistant bubble byte-exact == oracle (score 20/100, 5 numbered fixes + footer); __aiReqs [] — PASS
- L2 Score breakdown "Priority fixes": same 5 texts, same order, cap 5; High/High/Med/Med/Med badges match oracle impacts — PASS
- L3 pill-row click with chat non-empty: appended local pair, byte-exact == oracle, __aiReqs [] — PASS
- L4 typed "Frontend Engineer" into Professional title (UI keystrokes): reply byte-exact == recomputed oracle (fix #2 changed to "Write a 2–3 sentence summary"), differs from initial; __aiReqs [] — PASS
- L5 no-JD (JD cleared): reply byte-exact == nojd oracle (numbered-fixes form; keyword fix gone). No-fix UI states unreachable with realistic fixture — both no-fix strings verified byte-exact via pure-helper oracle only — PASS (no-fix UI: untested, oracle-verified)
- L6 regressions: Find matching jobs local (jobs link to /jobs, no AI); Draft my summary attempted /api/ai/assistant (quota-exhausted error shown — expected); Clear chat -> honestcv.assistantChat null; chat persisted across panel close/reopen and across reload (dark-theme reload) — PASS
- L7 375×812 panel open: scrollWidth === 375, bubble visible — PASS
- L8 bubble text contrast: light 16.73:1 / dark 12.69:1 — PASS
- L9 zero non-quota /api/ai/* from local task clicks; localStorage restored to exactly ["honestcv.clientId","honestcv.qa"] (removed app-set honestcv.seen.health too); light theme — PASS
