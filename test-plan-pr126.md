# PR #126 (E1 AI Tailor + E2 Health report) — Live test plan, cv.zalize.com (worker a00e9602)

Setup verified: deployed Builder chunk `/assets/Builder-D-O253pa.js` contains "Tailor to this job" (×2), "Full health report", "Get tailoring suggestions" (Builder is now code-split — main index chunk does NOT contain these strings; don't be fooled). `/api/ai/tailor` live (400 "Paste the job description first." on empty POST). `/api/health` llmConfigured:true.

Code evidence: Builder.tsx (pr126 diff) — Tailor button in "Target job" Section, `disabled={!resume.jobDescription.trim()}` with hint "Paste a job description to enable tailoring"; TailorDialog title "Tailor to this job", button "Get tailoring suggestions" → busy "Analyzing your resume against the JD…"; rows show `where` label, original struck-through (line-through decoration-red-300), suggestion in emerald; Accept → onApply updates summary/bullet + status "Applied to your resume"; Keep original → "Kept your original"; "Accept all remaining" button; empty-content error: "Add a summary or experience bullets first — tailoring rewords your real content." Quota via `freeRemaining` → footer "N free AI rewrites left". E2: link under Resume strength card "Full health report — N/100 across 6 checks" → HealthDialog "Resume health report — N/100", description "Six rule-based checks… a writing-quality heuristic, not a hiring prediction"; 6 dimensions (Completeness, Quantified impact, Action verbs, Brevity, Buzzword-free, Consistency) each with role=progressbar bar + findings (guidance.ts resumeHealth).

Pre-steps (before recording): fresh `honestcv.clientId` removed, `honestcv.qa='1'`, `honestcv.subscribed='1'`; load example resume; paste Stripe-style JD. Keep AI calls ≤2.

## 1. E2 Health report (local, no AI)
- Empty resume first (clear resume state / before loading example): link reads "Full health report — LOW/100"; open dialog → all six dimensions listed; Completeness/Quantified show low scores (Quantified summary: "No experience bullets yet"). Screenshot.
- Load example resume → link score visibly increases; reopen dialog → "N of M bullets carry a real number" reflects actual bullets; heuristic disclaimer text present. Pass: score changed between the two states; 6 progressbars visible. Fail: static score or missing dimensions.

## 2. E1 Tailor gating
- With JD empty: "Tailor to this job" button disabled + hint "Paste a job description to enable tailoring" visible. Paste JD → button enables, hint disappears.

## 3. E1 Tailor suggestions (1 AI call)
- Click Tailor → dialog with anti-fabrication description → click "Get tailoring suggestions"; busy label "Analyzing your resume against the JD…". Pass: within ~90s rows render, each with location label (e.g. "Software Engineer at Brightlane"), original struck-through, emerald suggestion.
- Grounding: suggestions must not invent employers/metrics; a vague bullet (seed one metric-free bullet as bait pre-run) should get `[bracketed placeholder]` or stay non-numeric, never a fabricated number.
- Quota: footer counter decrements by exactly 1 after the call (e.g. 12→11).
- Accept one row → status "Applied to your resume"; the corresponding editor field AND preview show the new text. Keep original on another row → status "Kept your original"; editor text unchanged. "Accept all remaining" applies the rest; counter "X accepted · 0 to review".

## 4. E1 error path (0 AI calls)
- Temporarily clear summary + all bullets (or use a scratch state), open Tailor with a JD present, click Get suggestions → instant error "Add a summary or experience bullets first — tailoring rewords your real content." No quota change. Undo/restore content afterwards.

## Regression (labeled)
- Golden path: PDF download works (real text via pdftotext).
- 375px (CDP metrics): /, /builder no horizontal overflow; open Tailor + Health dialogs at 375px — usable, no overflow.
- axe A/AA in-page on /builder with Health dialog open and with Tailor dialog open: 0 violations.
- Console: zero errors; no 4xx/5xx from /api/ai/tailor (except the intended error path returning inline message).
- Reduced motion: spot-check global kill-switch still computes 0.01ms animation (CDP emulation) — unaffected.
