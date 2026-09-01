# R205 QA plan — JD-aware guided summary drafts (index-By9S90K_.js / Builder-C4imn1SS.js)

Code evidence: Builder.tsx L2176-2185 trigger = "Draft from my resume" button in Summary section (only when summary empty; disabled unless resumeHasContent); dialog title "Draft my summary" L6583; note " Wording is tailored toward your target job description." appended to DialogDescription only when resume.jobDescription.trim() (L6586-6588); runSummaryDraft L1285-1300 sends jobDescription: resume.jobDescription.trim() || undefined; worker passes through to buildSummaryDraftMessages (prompts.ts L83-99, JD sliced to 4000 in a user part). Quota label "N free AI use(s) left" (L1998-2002).

## Y1 Bundles
index-By9S90K_.js; /builder Builder-C4imn1SS.js. PASS iff exact.

## Y2 Dialog note gating
Builder with example resume, summary cleared, JD set (with Kubernetes/Terraform, supported by resume) → open "Draft from my resume" dialog: description ends with "Wording is tailored toward your target job description." Clear JD → reopen: sentence absent (description ends "…already on your resume."). Screenshots both.

## Y3 Real call with JD (1 quota spend)
Enable CDP Fetch Request-stage on */summary-draft*. Click Draft with JD present. Assert intercepted request body JSON has jobDescription === the JD text (and resumeText/role present); continueRequest → real response. Assert 3 candidate drafts render, at least one contains a JD keyword (kubernetes/terraform case-insensitive), and the "free AI uses left" counter decremented by exactly 1 vs pre-call value.

## Y4 No-JD payload
Clear JD (Target job), reopen dialog, click Draft with Fetch intercept; assert request body has NO jobDescription key; fulfill with mock {text,texts:[3],freeRemaining} (no quota spend); 3 candidates render.

## Y5 Viewports + dark
Dialog at 1440 and 375 (document scrollWidth == innerWidth, dialog fits); dark mode: dialog text/note readable (screenshot + computed colors sane).

## Y6 Regression
R204: checker "Skills section present" fix → [data-section-anchor="skills"] in view; keyword fix → target in view (stub confirm). R203: example fixes +27/+3.8/+3.8, score 65, six dims 100.

## Y7 Cleanup
Only the one intended /api/ai/summary-draft real call (plus quota GETs); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production)
- Y1 bundles index-By9S90K_.js / Builder-C4imn1SS.js — PASS
- Y2 note present with JD ("…Wording is tailored toward your target job description."), absent without JD — PASS
- Y3 real JD call: payload keys [jobDescription,resumeText,role], jobDescription === JD verbatim; 3 candidates (Concise/Impact-focused/Keyword-focused); all mirror supported JD keywords AWS/CI/CD; unsupported Kubernetes/Terraform NOT invented (resume lacks them) — PASS
- Y4 no-JD payload: keys [resumeText,role], no jobDescription; 3 candidates render (mock) — PASS. NOTE: one extra REAL no-JD call fired accidentally (intercept event lost to helper's cmd loop; c.events buffer must be checked) — it also returned 3 candidates, real-path no-JD proof.
- Quota: /api/ai/quota freeRemaining is null in production (launch mode/unlocked) before and after calls — decrement not observable; API contract (freeRemaining field) intact — UNTESTABLE in prod
- Y5 dialog fits at 1440 & 375 (dialog fits:true; sw==iw at 375); page sw 1457@1440 is pre-existing, unrelated to dialog; dark desc text (145,153,165) on (9,13,20) peak contrast 6.77:1 — PASS
- Y6 regression: R203 overall 65, subs 61/75, fixes +27/+3.8/+3.8, High priority (7); keyword fix → target top 112 in view; skills structure fix → skills top 112 in view — PASS
- Y7 localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme — DONE. Real AI calls: 2 (1 intentional JD + 1 accidental no-JD).
