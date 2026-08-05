---
name: testing-honestcv
description: How to QA-test HonestCV (cv.zalize.com) end-to-end — free/launch mode, license activation, downloads, Paddle checkout, AI tools — without ever completing a real payment.
---

# Testing HonestCV

HonestCV is a React 19 + Vite SPA served by a Hono Cloudflare Worker (`honestcv`, repo `~/repos/honestcv`), live at https://cv.zalize.com. Resume state is browser localStorage (`honestcv.resume`); license state is also in localStorage. Clear localStorage to get a fresh locked state.

## Free/traffic mode (FREE_MODE=true worker var)

Check `curl -s https://cv.zalize.com/api/billing/status` — `{"freeMode":true}` means launch/free mode and the paywall paths below are bypassed:

- Builder header shows a **"Free during launch"** badge instead of "Unlock — $9.99 once".
- First PDF/DOCX click (unsubscribed) opens a **"Downloads are free during launch"** email dialog. Any valid-looking email works (no verification); it POSTs `/api/leads` with plan `free-download` and stores localStorage key `honestcv.subscribed`. The pending download then starts automatically; subsequent downloads skip the dialog. Clear both `honestcv.license` and `honestcv.subscribed` to re-test the gate.
- Bundle tools (Cover letter / Interview prep) open for everyone (no lock icon), consuming the anonymous free AI quota (12 per client per 30 days, sent via `x-client-id`).
- Standalone `/ats-checker`: check button disabled until resume text ≥30 chars; scoring is client-side.
- SEO set expanded: /vs/resume-io, /vs/resume-genius, /guides/{ats-friendly-resume,resume-summary-examples,resume-keywords}, /templates/{classic,modern,compact,executive}; sitemap.xml has 18 URLs; IndexNow key at /88d13cb021bb7d759cc09d7b95af03fc.txt.

## Key flows and how to test them (paid mode)

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
