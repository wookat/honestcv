# Competitor research — round 2 (Novorésumé firsthand)

Date: 2026-08-07. Method: ordinary public browsing + real account registration
(cvbench@zalize.com). No anti-bot bypass. Evidence classification per claim:
**observed** (firsthand), **claim** (public marketing/HTML), **inference**, **blocked**.

## Novorésumé — firsthand walkthrough (observed)

### Onboarding
- Editor is public before signup: template picked from marketing page opens a live
  editable preview immediately; registration modal (name + email, no password —
  "a password can be set after you sign up") is only required to save/continue.
- Email verification is a 6-digit code typed into the page (not a link).
- Post-signup personalization wizard, 4 steps: experience level (Student → Senior →
  Freelancer), target country (drives "Tailored for United States" optimizer),
  "most pressing issues" survey, and an email-tips opt-in (explicit opt-in, dismissible).
- The "No Thanks" button on the final wizard step errored twice ("Oops! Something
  went wrong") before succeeding via "Yes → dashboard" — rough edge, observed.

### Editor design/interaction
- WYSIWYG: you type directly into the rendered resume (contenteditable on every
  field), no separate form panel. Warning badges (red triangles) sit inline next to
  every empty/problem field; clicking one opens a popover ("Empty Section Detected →
  Edit Section").
- Left rail: ATS Checker, Import Content, Templates, Saved Content, Optimizer.
- Optimizer panel: "Advice 10 / Suggestions 3" counters with toggles, "Tailored for
  <country>" heading.
- Pre-download review modal (observed): "10 of total document issues could
  significantly hurt your chances with recruiters and ATS" listing e.g.
  "Two-Column Layout Detected", "Missing Professional Summary", "Missing City in
  Contact Info", "Empty Section Detected (7)", with **Download Anyway** / **Fix
  Issues** buttons.
- Download menu offers **PDF or TXT** ("Contains only the text of your document")
  plus a filename field. No DOCX export.
- Free download succeeded, watermark-free. PDF metadata: `Producer: GPL Ghostscript
  10.05.1`, `Creator: Mozilla/5.0 (X11; Linux x86_64…)` → server-side headless
  Chromium + Ghostscript post-processing (inference from observed metadata).

### Free-plan limits (observed)
- "Resume/CV Limit 1/1" on the dashboard: exactly one resume.
- Max 1-page resume, predefined layouts only, 3 fonts, 30 color themes, no cover
  letter (cover-letter card shows "Premium Required for Download").

### Pricing (observed on /page/pricing while logged in)
- Basic: free, unlimited duration.
- Premium: $21.99/month, $39.99/quarter ("Most Popular"), $139.99/year.
  Explicitly **non-recurring**: "Pay once. No recurring billing." and FAQ "you will
  not be charged automatically". 14-day refund window. Stripe/PayPal.
- Trustpilot 4.4 (1,589 reviews) shown on pricing page (claim).

### Tech notes (observed/inference)
- Marketing pages: Next.js (`_next` assets). Editor v2 is a separate React app
  (react-aria ids in DOM). PDF rendering server-side (see metadata above).

## Adoptable ideas → RezUp gaps
- **G9 (adopted this round): plain-text (.txt) export.** Cheap, ATS-safe, useful for
  paste-into-form applications. We already had `resumeToPlainText`.
- **G10: pre-download issue review.** We already gate downloads on Final Check —
  parity confirmed; Novorésumé's version adds layout-level checks (two-column
  detection). Ours templates are single-column ATS-safe by design, so no action.
- **G11 (candidate): inline warning badges on empty/problem fields** instead of a
  single aggregate strength meter. P2 — our per-bullet hints partially cover this.
- **G8 update: /vs/novoresume comparison page** shipped from this firsthand evidence.

## Honest assessment
Novorésumé's non-recurring pricing and free watermark-free download are fair —
our comparison page credits both. Structural differences we keep: browser-local
privacy, no account gate, unlimited copies/pages, DOCX export, one-time price.
