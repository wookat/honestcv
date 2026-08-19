# RezUp Benchmark Round 1 (PR #5) — Live Test Plan (cv.zalize.com)

Recorded browser run against live site. localStorage cleared for fresh subscribe gate. AI budget: max 2 calls (quota 12/30d per client).

Code evidence: src/pages/Builder.tsx (variant dialog ~L844, saveState ~L261, BulletGuidance ~L886, subscores ~L724, +kw chips ~L745), src/lib/guidance.ts, src/lib/ats.ts finalize(), src/pages/Landing.tsx COMPARISON.

## 1. Landing updates
- Open `/`, scroll to comparison table. Pass: row "AI rewriting" present ("Never invents facts — marks gaps with [add %]" vs "Often fabricates metrics and experience"); first row shows "$1.95–$2.95 “trial” → $25.95–$29.95 every 4 weeks"; copy says "We tested the big builders ourselves (August 2026)". Fail: old "$2.70" copy / no AI row.

## 2. Builder: autosave indicator + bullet guidance
- Open `/builder` (sample data). Pass precondition: header shows "Saved" text next to badge.
- Type into Full name; capture "Saving…" while typing (screenshot fast), then "Saved" after ~1s pause.
- In Role 1 bullets, add a new line: `Responsible for managing the team and working on various projects`. Pass: amber warnings appear below the textarea, including `⚠ Line 4: Starts with "responsible for"…` and a `"various" is vague` and/or `No numbers` message. Remove the line afterwards → warnings disappear.

## 3. ATS sub-scores + clickable missing-keyword chips
- With JD pasted in Target job: Pass: ATS card shows "Keywords NN" and "Structure NN" sub-scores; Missing keywords render as "+ keyword" pill buttons.
- Click one chip (e.g. `+ responsive`). Pass: keyword appended to Skills field text, chip disappears from Missing, keyword appears in Matched, score and Keywords sub-score increase. (Note exact before/after numbers.)

## 4. AI multi-variant rewrite (1 call)
- Click "AI polish summary". Pass: after ~60–90s a dialog "Pick a summary" opens with 3 option cards labeled Concise / Impact-focused / Keyword-focused, each with different text. Click one → dialog closes and Summary textarea content becomes the picked variant (visibly different from before). Fail: text applied directly with no picker, or error/524.
- (Skills "AI clean up" single-output path: not exercised — quota conservation.)

## 5. Regression: golden path
- Edit Full name to "QA Round1" → preview updates live.
- Switch template Classic → Modern → preview restyles.
- Clear honestcv.subscribed beforehand: PDF click → "Downloads are free during launch" dialog → subscribe qa-r1@example.com → PDF auto-downloads; DOCX downloads with no dialog. Verify files in shell (pdftotext / zip parse).
- `/ats-checker`: paste short resume + JD → score renders with matched/missing + format checks (also expect the new Keywords/Structure sub-scores if that page shares the card — observe and report).

## 6. Mobile spot check (~420px)
- Resize window; open /builder. Pass: single column, no horizontal overflow (scrollWidth <= innerWidth); autosave text hidden (sm:inline) is acceptable/expected on narrow screens.

Throughout: console clean; no Paddle testing.
