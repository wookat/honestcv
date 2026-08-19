# RezUp Live Test Plan (https://cv.zalize.com)

All tests against live site in Chrome, recorded. localStorage cleared first.

## 1. Landing + CTA
- Open `/`. Pass: hero renders with one-time-payment messaging, title "RezUp — One-Time Payment Resume Builder...". Click primary CTA → URL becomes `/builder`.

## 2. Builder: sample data, editing, live preview, templates
- Click "Load an example resume" link. Pass: editor fields fill (name Jordan Reyes-like sample) and right preview shows same content.
- Edit Full name to "QA Tester" — Pass: preview name updates to "QA Tester" live.
- Click each template pill (Classic/Modern/Compact/Executive). Pass: preview visibly restyles per template (accent/layout changes between screenshots).

## 3. ATS score
- Paste a frontend JD into "Job description". Pass: ATS score number changes from pre-paste value; "Matched (n)" and "Missing (n)" keyword lists appear; structural checks list ✓/✗ items. Then add a missing keyword to Skills → score increases / keyword moves to Matched.

## 4. AI rewrite (free tier)
- Click "AI polish summary". Pass: summary text is replaced with rewritten text (different from before) and "N free AI rewrites left" note appears. Also "AI rewrite bullets" on Role 1 returns rewritten bullets.

## 5. Paywall + Paddle overlay (NO payment)
- Click "PDF" while locked. Pass: UpgradeDialog opens showing "$9.99" Single Resume and "$19.99" Career Bundle.
- Click "Get Career Bundle — $19.99". Pass: Paddle overlay checkout iframe opens showing the product/price. Close overlay without paying. ⚠️ Never enter card details.

## 6. License activation
- In dialog, enter `CV-QA01-TEST-2026-GATE` → Activate. Pass: green "License activated — Career Bundle" message; dialog closes/refresh; header badge shows "Career Bundle" (not "Unlock — $9.99 once").

## 7. Downloads + export quality
- Click PDF → file downloads. Open PDF: Pass: real selectable text (pdftotext extracts name/summary), single-column clean layout.
- Click DOCX → downloads; parse (python-docx or unzip document.xml) — Pass: contains resume text.

## 8. Bundle tools
- Click "Cover letter": dialog opens (no upsell). Click Generate. Pass: multi-paragraph cover letter text appears in textarea.
- Click "Interview prep" → Generate. Pass: interview brief text returned.

## 9. SEO pages
- Visit /vs/zety, /resume-builder-one-time-payment. Pass: pages render distinct content with proper document titles; sitemap.xml lists 5 URLs; robots.txt allows all (already verified via curl, re-show in browser).

## 10. Mobile responsiveness
- Resize viewport to ~390px width (devtools device toolbar or window resize). Pass: landing and /builder stack into single column, no horizontal scrollbar/overflow; header controls usable.

Throughout: watch console for errors; report any.
