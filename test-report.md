# HonestCV Live Acceptance Test Report

**Target:** https://cv.zalize.com (live Cloudflare Worker `honestcv`, PR https://github.com/wookat/honestcv/pull/1)
**Method:** Full browser run against the live site in Chrome (recorded), fresh localStorage, plus shell verification of downloaded artifacts. No payment was completed at any point.

## Summary

Core product works end-to-end on the live site: landing, builder, live preview, 4 templates, client-side ATS scoring, AI summary rewrite, paywall dialog, seeded license activation, and PDF/DOCX export all passed. **Two runtime failures block full acceptance:**

1. **Paddle checkout overlay errors with "Something went wrong"** — overlay opens but never shows a usable checkout, so 付费端到端 is NOT provable.
2. **Both Career Bundle AI tools (Cover letter, Interview prep) fail with 524 gateway timeouts** — the LLM call exceeds Cloudflare's ~100s limit; tested 3 times total, all failed.

## Results

| # | Test | Result |
|---|------|--------|
| 1 | Landing renders (desktop + mobile), CTA → /builder | ✅ Pass |
| 2 | Sample resume load, field edits, live preview, 4 templates restyle | ✅ Pass |
| 3 | ATS score updates live with JD (100 → 46), keyword lists + structural checks; adding skills raised score (46 → 57 → 65) | ✅ Pass |
| 4 | AI polish summary returned rewritten text; quota showed "4 free AI rewrites left" (slow, ~60s) | ✅ Pass (AI rewrite bullets not exercised separately — same endpoint) |
| 5 | Paywall dialog with $9.99 / $19.99 on locked PDF click | ✅ Pass |
| 5b | Paddle overlay opens usable checkout | ❌ **FAIL — "Something went wrong" error in overlay** |
| 6 | License key `CV-QA01-TEST-2026-GATE` activates; header shows "Career Bundle"; downloads unlock | ✅ Pass |
| 7 | PDF download: real selectable text (pdftotext extracts all content), clean single-column layout; DOCX parses (document.xml contains full resume) | ✅ Pass |
| 8 | Cover letter generate | ❌ **FAIL — "The AI service returned an error (524)" twice** |
| 8b | Interview prep generate | ❌ **FAIL — same 524 error** |
| 9 | SEO pages (/vs/zety, /resume-builder-one-time-payment) with proper titles; sitemap.xml (5 URLs); robots.txt allows all | ✅ Pass |
| 10 | Mobile ~390px: landing + builder stack single column, `scrollWidth <= innerWidth` (no horizontal overflow) | ✅ Pass |
| — | Console errors | ✅ None observed |

## Failure evidence

### 🔴 Paddle checkout error (blocks payment E2E)

![Paddle overlay error](https://app.devin.ai/attachments/9d797ef3-b86e-4a54-8ee9-b76bea491b33/ss_af0ed2dc.png)

Diagnosis: `/api/billing/status` returns `{"checkoutEnabled":true}`; the deployed JS bundle contains a **live** Paddle client token (`live_fe86713…`) and both price IDs (`pri_01kz7xjszz…`, `pri_01kz7xjt5z…`). Since the overlay itself renders and then errors, the most likely causes are: the domain `cv.zalize.com` not yet approved in the Paddle account (live checkouts require domain approval), the Paddle account still under review, or the price IDs not active. This must be fixed and re-verified before the payment path can be accepted.

### 🔴 Bundle AI tools 524 timeouts

| Cover letter | Interview prep |
|---|---|
| ![Cover letter 524](https://app.devin.ai/attachments/0754bb00-846f-448d-8b7c-0f71193be93d/ss_02698191.png) | ![Interview prep 524](https://app.devin.ai/attachments/8499caba-ad32-42bb-9eb1-86ce7157030b/ss_65a58270.png) |

Each generate attempt spun for ~100s then failed with "The AI service returned an error (524)". 524 is Cloudflare's origin-timeout; the `grok-4.5` relay is too slow for these longer generations (the short summary rewrite also took ~60s but squeaked under the limit). Suggested fixes: stream the response, use a faster model for these tools, or split generation into smaller chunks.

## Pass evidence

### 🟢 License activation → Career Bundle unlocked

![License activated, header shows Career Bundle](https://app.devin.ai/attachments/95346341-a864-4969-9888-dd5956dd5d15/ss_70f8e7ea.png)

### 🟢 PDF export — real text, single column

![PDF opened in viewer](https://app.devin.ai/attachments/83d565d4-ab95-48a1-9cd2-3a1fab6ee9bf/ss_0216bc8a.png)

`pdftotext` extraction (proves selectable, ATS-parseable text):

```
QA Tester
Software Engineer
jordan.reyes@email.com | (555) 210-4432 | Austin, TX | linkedin.com/in/jordanreyes
SUMMARY
Frontend Engineer with 4 years of experience building customer-facing web applications...
EXPERIENCE
Software Engineer · Brightlane, Austin, TX
• Led migration of the checkout flow to React + TypeScript, reducing cart abandonment by 12%
```

DOCX: `word/document.xml` contains the complete resume text (verified via zip parse). Export quality: single-column, clean headings, no watermark — meets the "better than WolfResume at this price" bar for ATS layout.

### 🟢 ATS scoring + builder (desktop)

| ATS score/keywords after JD paste | Upgrade dialog ($9.99 / $19.99) |
|---|---|
| ![ATS score](https://app.devin.ai/attachments/fc1b4aba-6cb1-429e-800c-b4477cbf3fdc/ss_f132dd3f.png) | ![Upgrade dialog](https://app.devin.ai/attachments/55735677-af35-4be5-b1bc-95cfeca2e212/ss_39ca1a56.png) |

### 🟢 SEO + mobile

| /vs/zety SEO page | Mobile landing (~390px) | Mobile builder (~390px) |
|---|---|---|
| ![vs zety](https://app.devin.ai/attachments/8d639651-38e6-4205-9946-8a1b826d87d5/ss_57c4eb18.png) | ![mobile landing](https://app.devin.ai/attachments/feb83fa8-db4c-49f0-bd40-1b636cca28ca/ss_2aa74cc8.png) | ![mobile builder](https://app.devin.ai/attachments/9d996664-921f-41b8-9b0a-cf4c3d4d8852/ss_ad01ffff.png) |

## Notes / minor observations

- ATS keyword extraction includes punctuation-suffixed tokens as "missing" keywords (e.g. `skills.`, `plus.`, `designers.`) — cosmetic quality issue in the tokenizer.
- AI summary rewrite latency ~60s on live; near the 100s Cloudflare cutoff.
- The free-quota 402 path was not driven to exhaustion (would consume the remaining free rewrites at ~60s each); code path was inspected but not runtime-proven.
- Recording: `/home/ubuntu/screencasts/rec-5f26c708-a8db-4198-b84a-7781b3cdf8f5/rec-5f26c708-a8db-4198-b84a-7781b3cdf8f5-edited.mp4`
