---
name: testing-honestcv
description: How to QA-test HonestCV (cv.zalize.com) end-to-end — license activation, downloads, Paddle checkout, AI tools — without ever completing a real payment.
---

# Testing HonestCV

HonestCV is a React 19 + Vite SPA served by a Hono Cloudflare Worker (`honestcv`, repo `~/repos/honestcv`), live at https://cv.zalize.com. Resume state is browser localStorage (`honestcv.resume`); license state is also in localStorage. Clear localStorage to get a fresh locked state.

## Key flows and how to test them

- **Locked vs unlocked**: header shows "Unlock — $9.99 once" when locked; after activation it shows a "Career Bundle" (or plan) badge and PDF/DOCX buttons work.
- **License activation**: open the upgrade dialog (click PDF while locked or the Unlock button), use "Already paid? Re-activate with your license key". Seeded test keys (e.g. `CV-QA01-TEST-2026-GATE`) are KV-backed bundle licenses. Activation is instant, no reload needed.
- **Paddle checkout**: click a buy button → Paddle overlay should open. ⚠️ This is LIVE Paddle — never enter card details. If the overlay shows "Something went wrong", check: `/api/billing/status` (should be `{"checkoutEnabled":true}`), and grep the deployed bundle for the token/price IDs (`curl -s https://cv.zalize.com/assets/index-*.js | grep -oE 'live_\w+|pri_\w+'`). Token/prices present + overlay error usually means the domain isn't approved in the Paddle dashboard or the account/prices aren't active.
- **Downloads**: files land in `~/Downloads`. Verify PDF with `pdftotext file.pdf -` (must extract real text) and DOCX by unzipping `word/document.xml`. Note: clicking PDF opens the PDF in a new Chrome tab AND downloads it — switch back to the builder tab before clicking DOCX.
- **AI endpoints** (`/api/ai/rewrite`, cover letter, interview prep): relayed to an LLM (model set in wrangler.jsonc `LLM_MODEL`). These are SLOW (~60s for a summary rewrite) and longer generations may fail with a Cloudflare **524 timeout** — retry once, but repeated 524s are a real product issue, not an environment problem. 5 free rewrites per client when locked; 402 → upgrade dialog after exhaustion.
- **Bundle tools** (Cover letter / Interview prep) require an active bundle license AND a pasted job description in "Target job".
- **ATS score** is computed client-side and updates live when the JD or resume fields change.
- **Mobile check**: `wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz && wmctrl -r :ACTIVE: -e 0,100,0,390,760`, then verify `document.documentElement.scrollWidth <= window.innerWidth`.
- **SEO**: static pages at /vs/zety, /vs/livecareer, /resume-builder-one-time-payment, /free-ats-resume-checker; sitemap.xml lists 5 URLs; robots.txt allows all.

## Devin Secrets Needed

None — the seeded test license key is provided by the user per run.
