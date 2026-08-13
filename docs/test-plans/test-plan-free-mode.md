# HonestCV Free/Traffic Mode Test Plan (PR #3, live at cv.zalize.com)

Precondition: clear localStorage (removes old bundle license + subscribed flag) so free-mode gating is observable. Recorded browser run.

## 1. Landing free-mode copy
- Open `/`. Pass: hero/pricing shows launch-free messaging (not "$9.99 one time to download" hero as before — expect free-during-launch wording). Screenshot.

## 2. Builder free-mode badge + subscribe-gated download
- Open `/builder` (sample data persists or reload sample). Pass: header shows "Free during launch" badge, NOT "Unlock — $9.99 once" button.
- Click PDF. Pass: dialog titled "Downloads are free during launch" appears with email field — NOT the $9.99/$19.99 UpgradeDialog.
- Enter invalid email `foo` → click "Unlock free downloads". Pass: error "Please enter a valid email address."
- Enter `qa-free-test@zalize.com` → submit. Pass: dialog closes AND the PDF download proceeds automatically (pendingDl). Verify file in ~/Downloads with pdftotext (real text).
- Click DOCX. Pass: downloads immediately with NO dialog (honestcv.subscribed set). Verify document.xml parses.

## 3. Bundle tool open for everyone (Cover letter only)
- Ensure JD pasted in Target job. Click "Cover letter" (no lock icon expected). Pass: dialog opens with no upsell. Click Generate; wait up to ~120s. Pass: multi-paragraph letter text appears (this previously 524'd — fixed via grok-composer-2.5-fast; a 524 now = FAIL).

## 4. /ats-checker end-to-end
- Open `/ats-checker`. Pass: "Check my ATS score" button disabled until resume text ≥30 chars pasted.
- Paste resume text + JD → click check. Pass: score `N/100` renders with color, Matched/Missing keyword badges, format checks list; CTA to /builder present.

## 5. New SEO pages
- Visit `/vs/resume-io` and `/guides/ats-friendly-resume`. Pass: distinct content pages render with proper titles. Confirm sitemap.xml includes new URLs (curl).

## 6. Mobile spot check
- Resize to ~390px; view `/` and `/builder`. Pass: single-column stacking, no horizontal overflow (scrollWidth <= innerWidth).

Throughout: no console errors; do NOT test Paddle checkout.
