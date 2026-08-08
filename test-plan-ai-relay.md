# AI relay retest (glm-5.2, PR #118) — Live UI test plan (cv.zalize.com)

Setup verified: `/api/health` → `{"ok":true,"llmConfigured":true}`; `/api/billing/status` → freeMode:true. Code evidence: src/lib/license.ts:17 clientId in `localStorage['honestcv.clientId']` (sent as `x-client-id`); worker/index.ts:58 FREE_MODE_AI_CALLS=12 per client id → remove the key pre-run for a fresh quota. Builder.tsx:1647 cover/interview tools open freely in freeMode; BundleToolDialog requires a pasted JD (error at L2073 otherwise); summary polish shows a variant-pick dialog "Three honest takes on your text — nothing invented. Bracketed placeholders like [add %]…" (L1707). AI calls are slow (~30–90s); one 524 retry allowed, repeated 524s = product issue.

Pre-steps (before recording): remove `honestcv.clientId`, keep `honestcv.qa='1'` + `honestcv.subscribed='1'`; example resume loaded; paste a JD with metrics-bait wording into Target job (e.g. frontend role asking for % improvements) so anti-fabrication can be judged.

## 1. AI polish summary
- In /builder, click "AI polish summary" beneath the Summary textarea. Pass: button shows busy state, then a variants dialog opens with up to 3 rewritten summaries of the actual draft (mentions React/TypeScript etc. from the source text). Fail: error message (out of credit/524 twice) or empty dialog.
- Anti-fabrication: rewritten text must NOT contain invented employers/metrics absent from the draft; any missing number should appear as a bracket placeholder like `[add %]` (acceptable: no placeholder if no new claims). Pick one variant → summary field + preview update.

## 2. Cover letter tool
- Scroll below preview, click "Cover letter" → dialog "Cover Letter" opens (no lock icon; freeMode). Enter company "Stripe", click Generate. Pass: within ~90s a multi-paragraph letter referencing the resume's real experience (Brightlane/Nova Retail or their achievements) and JD keywords appears in the textarea; addressed for Stripe. Fail: error text or template-only output.

## 3. Interview prep tool
- Click "Interview prep" → dialog "Interview Prep Brief", click Generate. Pass: structured brief (likely questions/STAR-style content) grounded in the resume and JD. Fail: error/empty.

## 4. Negative check (proves gating logic, cheap)
- Before pasting the JD (step order: do this FIRST): open Cover letter and click Generate with empty JD. Pass: exact error 'Paste the job description in "Target job" first — both tools tailor to it.' and no request delay.

Throughout: console clean (no 4xx/5xx from /api/ai/*); annotate recording. Quota note: total calls used ≤ 4 of 12.
