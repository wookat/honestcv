# PR #132 — acceptance-review remediation, live test plan (cv.zalize.com, worker f20a5e6f)

Deployment verified: index-B1bON4Xv.js contains "never sold or shared"; chunks Builder-78-yfFSl.js / AtsChecker-Bn0lLhfu.js.

Code evidence (135ef4c): Paywall.tsx L274+ (privacy paragraph + /privacy/ link), resume.ts sampleResume `templateId:'modern'`, AtsChecker.tsx "How it's combined" li, Builder.tsx: ×70%/×30% spans gated on `ats.keywordScore !== null`, `<details>` "How this score is calculated" with two text variants + score-100 sentence, mobile pane switcher (role=group, aria-label "Switch between editing and preview", two buttons min-h-11 with aria-pressed, panes get `hidden lg:block`), busy status lines "Usually takes 10–20 seconds…" in TailorDialog and BundleToolDialog.

## 1. P1 ATS explainability (/builder, right column)
- Fresh-ish state, load example resume, NO JD: sub-score row shows "Structure 100" with **no ×30%** and no Keywords row. Expand "How this score is calculated" → text starts "Without a job description the score is the 6-point structure checklist below" and includes "(6 of 6 passing)". Fail: weights shown without JD, or details missing.
- Paste a JD: row shows "Keywords N ×70%" and "Structure 100 ×30%". Details text switches to "Score = keyword coverage ×70% + structure checks ×30%…". If overall score is 100 the second paragraph must include "A 100 means every rule passes, not that an interview is guaranteed." (use a tiny JD made of resume keywords to force 100; skip the 100-sentence assertion if 100 not reachable, but the no-JD state IS 100 structure-only → check the sentence there).
- /ats-checker: "see an example score" → expand "What do these scores mean?" → new li "How it's combined — overall score = keyword match ×70% + structure ×30%…". Fail: only 3 items (Keyword match/Structure/What to do).

## 2. P2① email-gate privacy (Builder → PDF without honestcv.subscribed)
- Remove `honestcv.subscribed` from localStorage, click PDF. Dialog shows existing "One email, all downloads…" AND new paragraph "What we send: occasional HonestCV product updates only (a few per year). Your email is never sold or shared, and your resume never leaves this browser." with underlined "Privacy policy" link → href /privacy/ and clicking it opens the privacy page (200, heading visible). Fail: only the old single footer paragraph.

## 3. P2② mobile pane switcher (375×812 CDP)
- /builder at 375px: NO floating "Preview" button bottom-right. Instead fixed bottom bar (role=group aria-label "Switch between editing and preview") with buttons "Edit" (aria-pressed=true initially) and "Preview & score" (false); each ≥44px tall. Editor pane visible, preview pane hidden (offsetParent null / display none).
- Tap "Preview & score" → preview + ATS card visible, editor hidden, aria-pressed swaps, page scrolled to top. Tap "Edit" → back.
- Overflow: scrollWidth ≤ 375. Bottom padding: scroll to page bottom in Edit pane → footer/last content not covered by the bar (main has pb-20).
- Desktop (≥1024): bar hidden (lg:hidden), both columns visible side-by-side.

## 4. P2③ themed example export
- Fresh resume state → "Load an example resume" → template must be **Modern** (selected chip Modern, preview shows teal accents — headings/rule colors, not black-only Classic serif).
- Download PDF via gate using qa+pr132@example.com. Verify: pdftotext extracts "Jordan Reyes"+SUMMARY (real text) AND the PDF contains a non-black accent color — extract color ops (rg/RG) from content stream or render page to PNG (pdftoppm) and check heading pixels are teal (r<100, g>100, b>100 approx), not monochrome. Fail: PDF renders grayscale/black-only.

## 5. AI wait expectation (1 Tailor call max)
- Paste JD → Tailor to this job → Get tailoring suggestions → while busy the dialog shows "Usually takes 10–20 seconds — every line comes back for your review before anything changes." (screenshot while spinner active). Accept none / close after result.
- Cover letter busy line: only if it can be triggered without extra quota — otherwise assert untested (it consumes a call; the Tailor call already proves the same new pattern, BundleToolDialog line differs only in wording "…the draft appears here for you to edit."). Default: skip to save quota, mark untested.

## 6. Regression
- Golden path: example → edit name → ATS score updates → PDF download real text (covered by #4).
- 375px: no horizontal overflow /builder (covered in #3) and /.
- axe A/AA on / and /builder: 0 violations (builder with bottom bar at 375 and desktop).
- Console: zero real errors (ignore cloudflareinsights beacon block).

Recording: annotate per test; existing QA browser (honestcv.qa=1, gate may need qa+pr132@example.com since subscribed key will be cleared).
