# I4-I6 live test plan (cv.zalize.com, main 241e5d2)

Code grounding: worker/index.ts (commit 3fc682f) — `/api/ai/rewrite` + `/api/ai/tailor` now call `peekFreeQuota` before the LLM call and `consumeFreeQuota` only after success; failures return the error without consuming. I5 (ec82872) adds one retry on 429/5xx inside `callLlm`. AI relay is DOWN (all calls 503/429) — success smoke stays pending. Max 2 AI attempts; plan uses 1.

## 1. I4 — failed AI call shows honest error and does NOT decrement quota
- Fresh QA state: `honestcv.qa=1`, NEW random `honestcv.clientId`, onboarding keys cleared.
- /builder → Load example resume → paste a short JD in Target job.
- Record baseline: footer must read "12 free AI rewrites left" AND `GET /api/ai/quota` (from page console with x-client-id) returns `{"freeRemaining":12}`.
- Click "Tailor to this job" → "Get tailoring suggestions" (1 AI attempt; expect ~failure after the I5 retry delay).
- PASS: dialog shows an honest inline error (red "The AI service returned an error (503/429). Please retry." — role/status text), AND after the failure the footer still reads "12 free AI rewrites left" (reload allowed) AND `GET /api/ai/quota` still returns 12.
- FAIL: counter or API value drops to 11 (old pre-I4 behavior), or no visible error.

## 2. Fresh new-user UX walkthrough (acceptance-officer polish pass, no AI)
- Landing desktop: hero, 3-step, templates, pricing, FAQ — screenshot; note polish issues.
- Landing 375px: same sections stacked, scrollWidth ≤ 375.
- /builder golden path (separate fresh onboarding state): checklist → Load example → ATS pane → PDF download via gate (qa-beta@zalize.com if prompted) → pdftotext real text.
- /builder 375px: Edit/Preview switcher walkthrough.
- /ats-checker: "see an example score" (no AI) → sub-scores + expander render.
- /guides/ hub + one guide page skim.
- Output: P0/P1/P2 polish list (anything confusing, misaligned, broken copy, dead ends).

Budget: 1 AI attempt (2 max). Recording annotated per test. No payment, never wookat@qq.com.
