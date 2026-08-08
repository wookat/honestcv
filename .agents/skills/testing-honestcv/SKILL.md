---
name: testing-honestcv
description: How to QA-test HonestCV (cv.zalize.com) end-to-end — free/launch mode, license activation, downloads, Paddle checkout, AI tools — without ever completing a real payment.
---

# Testing HonestCV

HonestCV is a React 19 + Vite SPA served by a Hono Cloudflare Worker (`honestcv`, repo `~/repos/honestcv`), live at https://cv.zalize.com. Resume state is browser localStorage (`honestcv.resume`); license state is also in localStorage. Clear localStorage to get a fresh locked state.

## Free/traffic mode (FREE_MODE=true worker var)

Check `curl -s https://cv.zalize.com/api/billing/status` — `{"freeMode":true}` means launch/free mode and the paywall paths below are bypassed:

- Builder header shows a **"Beta free trial"** badge (was "Free during launch" before PR #112) instead of "Unlock — $9.99 once".
- First PDF/DOCX click (unsubscribed) opens a **"Downloads are included in the beta trial"** email dialog (was "Downloads are free during launch"; button is now "Unlock downloads"). Any valid-looking email works (no verification); it POSTs `/api/leads` with plan `free-download` and stores localStorage key `honestcv.subscribed`. The pending download then starts automatically; subsequent downloads skip the dialog. Clear both `honestcv.license` and `honestcv.subscribed` to re-test the gate.
- Set `localStorage['honestcv.qa']='1'` before browsing so the site's analytics excludes the QA session.
- Bundle tools (Cover letter / Interview prep) open for everyone (no lock icon), consuming the anonymous free AI quota (12 per client per 30 days, sent via `x-client-id`).
- Standalone `/ats-checker`: check button disabled until resume text ≥30 chars; scoring is client-side.
- SEO set expanded: /vs/resume-io, /vs/resume-genius, /guides/{ats-friendly-resume,resume-summary-examples,resume-keywords}, /templates/{classic,modern,compact,executive}; sitemap.xml has 18 URLs; IndexNow key at /88d13cb021bb7d759cc09d7b95af03fc.txt.

## AI relay retest recipe (PR #118, glm-5.2 relay)

- Fresh quota: delete `localStorage['honestcv.clientId']` before loading /builder — a new id is generated and the 12-call free quota resets. Quota footer text ("N free AI rewrites left") decrements for summary/bullet rewrites; Cover letter / Interview prep calls did not visibly change the footer count in one run.
- All three tools verified live: "AI polish summary" → 3-variant dialog (~30–60s); "Cover letter" / "Interview prep" buttons sit below the preview → dialog with Company field / Generate (~30–40s). Clicking Generate with an empty JD returns instantly with: `Paste the job description in "Target job" first — both tools tailor to it.`
- The "AI polish summary" button appears disabled while the request is in flight — wait, don't reclick.
- Anti-fabrication check: seed the summary with a vague claim (e.g. "significantly improved checkout conversion"); good output keeps it non-numeric or uses `[add %]`, never invents a figure. Cover letter/interview brief should honestly acknowledge JD gaps (e.g. "have not worked in payments directly").

## PR #5 features (AI variants, guidance, sub-scores, autosave)

- **AI multi-variant rewrite**: "AI polish summary" / "AI rewrite bullets" send `variants:true` to `/api/ai/rewrite`; a "Pick a summary/rewrite" dialog shows 3 options labeled Concise / Impact-focused / Keyword-focused. Clicking one applies it. "AI clean up skills" stays single-output. One variants call = one quota unit; failed calls do NOT decrement quota.
- **AI relay 403s**: the upstream relay may start returning fast (<1s) 403 errors ("The AI service returned an error (403). Please retry.") after a successful call — this reproduced for ~25 min in one run and is relay-side rate limiting/auth, not a payload issue. Diagnose by counting `/api/ai/rewrite` entries with `performance.getEntriesByType('resource')` (successes take 40–90s; 403s ~0.6–1.2s).
- **Bullet guidance** is local/rule-based (`src/lib/guidance.ts`): a bullet starting with "responsible for" and containing no digit shows two amber "⚠ Line N:" warnings under the Experience textarea (max 2 issues per line, max 4 lines shown).
- **ATS card** shows Keywords/Structure sub-scores and clickable `+ keyword` chips that append to Skills and live-update the score. The standalone /ats-checker page does NOT show sub-scores (builder only).
- **Autosave**: header "Saved" flips to "Saving…" while typing (400ms debounce); hidden below the `sm` breakpoint.

## PR #6 features (undo, reorder, import, accent, final check)

- **Deployment cache**: the live page may serve a stale JS bundle after a new deploy — hard refresh (Ctrl+Shift+R) and grep the bundle for a new-feature string (e.g. `curl -s https://cv.zalize.com/assets/index-*.js | grep -c 'Final check before download'`) before testing.
- **Global undo**: header Undo2 button (title "Undo (Ctrl+Z)"), disabled until an edit; snapshots are throttled (~700ms). Ctrl+Z triggers resume-undo only when focus is NOT in an input/textarea (inside a field it does native text undo) — blur by clicking page background first.
- **Reorder**: ArrowUp/ArrowDown per Experience role header and Education row; disabled at list ends; verify order change in the live PREVIEW, not just the editor.
- **Import from text**: "Import from text" button top-right of editor column; import replaces the whole resume and is undoable. Parenthesis-mangling parser bugs (phone losing leading `(`, `Company (` residue from date ranges) were fixed in worker version 6be274e2 — but still check imported field contents character-for-character, not just non-emptiness (`src/lib/importText.ts`).
- **Accent swatches**: 8 dots after the template buttons (aria-label `Accent color #hex`). Verify PDF carry-over objectively: decompress the PDF content stream and look for the accent's normalized RGB (e.g. #1d4ed8 ≈ 0.114 0.306 0.847 rg), or render the page to PNG.
- **Final check dialog**: appears on PDF/DOCX click only when ATS structural checks fail or bullet-quality warnings exist (keyword score does NOT count). "Keep editing" closes without downloading; "Download anyway" downloads; a clean resume downloads immediately with no dialog.

## PR #8 / Round 3 features (8 templates, checker sub-scores, template pSEO)

- **Templates 4→8**: Minimal / Bold / Elegant / Engineer added in `src/lib/templates.ts` with two new axes: `headerAlign` ('left' on all 4 new ones vs 'center' on the original 4) and `nameCase` ('upper' only on Bold). Verify per-template from preview pixels: left vs centered header, Bold uppercase name + thick #1d4ed8 rules. A user-chosen accent swatch overrides the template accent (so Elegant/Engineer may not show purple/green) — assert alignment/case/divider, not hue, unless localStorage accentColor is cleared.
- **Download carry-over**: check header alignment in exports — PDF via `pdftoppm` render (uppercase name at left margin) and DOCX via `word/document.xml` (`w:jc w:val="left"`, no `center` near the name).
- **/ats-checker sub-scores**: with resume only → "Structure N/100" + hint "Add a job description to get a keyword match score." (no Keyword span); with a JD → both "Keyword match X/100" and "Structure Y/100".
- **pSEO**: /templates/{minimal,bold,elegant,engineer} return 200 after trailing-slash redirect with distinct titles; each cross-links the other 7 templates and CTA-links /builder.
- **Mobile (~420px)**: template row wraps to 2 chip rows + swatch row with no horizontal overflow; note the first (black) swatch wraps up next to the "Engineer" chip and can read as a 9th template dot. Reorder/undo/delete icons are ~28–32px tap targets.

## PR #9 / Round 4 features (drag reorder, custom sections, section order, 12 templates)

- **Drag reorder (Experience/Education)**: GripVertical handle at the card's upper-left is the ONLY drag source (`draggable` on the handle); the whole card is the drop target and highlights `border-primary bg-primary/5` while hovered mid-drag. Arrows remain. To test a real HTML5 drag with computer-use: `mouse_move` onto the handle first, then `left_mouse_down` (no coordinate arg — it errors), several `mouse_move` steps over the target, `zoom` mid-drag to capture the highlight, then `left_mouse_up`. Negative-test by dragging from the card body (should do nothing).
- **Custom sections**: "Custom sections (optional)" panel → title + one bullet per line textarea; renders as a template-styled heading + bullets in preview/PDF/DOCX. Delete (trash) removes it from editor, Section order list and preview. Verify exports via `pdftotext` and `word/document.xml`.
- **Section order panel**: collapsed by default; lists the 6 built-ins (Summary, Experience, Projects, Education, Skills, Certifications) + one row per custom section. Supports both arrows and the same grip-handle drag. Order syncs to preview/PDF/DOCX (check heading byte offsets in document.xml). Empty sections (e.g. Certifications with no content) are omitted from outputs — not a bug.
- **Templates 8→12**: Ivy (serif, center, title-case, green), Slate (sans, left, thick rules, gray), Corporate (serif, center, UPPERCASE name, thick rules, dark red), Startup (sans, left, no divider rules, orange). Accent-swatch override still applies — assert case/align/divider axes, not hue.
- **pSEO**: /templates/{ivy,slate,corporate,startup} → 200, distinct titles, /builder CTAs, beacon script. Landing/paywall copy says "All 12" (grep bundle for absence of "All 4").

## PR #116 / Visual upgrade round 1 (22 templates, band headings, ScoreRing, brand)

- **Templates 12→22**: Horizon, Metro, Scholar, Ink, Coral, Atlas, Prairie, Quartz, Ruby, Cobalt. Horizon/Metro/Scholar/Ink/Ruby have `band: true` — accent-tinted band behind heading text. `accentTint(hex)` = 12% mix toward white (e.g. #0e7490 → #e2eef2). Band template thumbnails show a full-width tinted strip instead of the plain accent bar.
- **Band verification per surface**: preview — h3 has inline `background` tint; PDF — decompress content streams and look for the tint's normalized RGB fill (e.g. `0.886 0.933 0.949 rg` for #e2eef2) plus real `drawText` headings (pdftotext must extract them); DOCX — `word/document.xml` has `<w:shd w:fill="e2eef2" w:val="clear"/>` on heading paragraphs and NO bottom border there.
- **Deep-link pitfall**: `/builder?template=horizon` applies Horizon, but clicking "Load an example resume" afterwards resets the template to Classic (example data carries its own `templateId`) — re-select the template after loading.
- **ScoreRing** (/ats-checker): animated ring + count-up; `span[role="img"]` with `aria-label="Score N out of 100"`. Screenshot immediately after clicking "Check my ATS score" to catch mid-count-up. Reduced motion: launch a second Chrome with `--force-prefers-reduced-motion` — final value + full ring on first frame.
- **375px emulation**: Chrome's minimum window width (~500 CSS px) prevents wmctrl-resizing to 375 — instead use CDP `Emulation.setDeviceMetricsOverride` (websocket-client with `suppress_origin=True` to dodge the 403 origin check on port 29229); clear with `Emulation.clearDeviceMetricsOverride`.
- **axe without chromedriver**: `@axe-core/cli` fails (no chromedriver on the box); instead inject axe.min.js (cdnjs) via CDP `Runtime.evaluate` and run `axe.run()` in the live page.
- **Static asset cache pitfall**: after deploys, `/og.png` (and similar public/ assets) can stay stale at the Cloudflare edge (`cf-cache-status: HIT`) even when the JS bundle is fresh — compare live md5 against the branch file; a cache purge may be needed.
- pSEO expanded: /templates/{horizon,metro,scholar,ink,coral,atlas,prairie,quartz,ruby,cobalt}/ all 200 with SVG layout previews and cross-links. Landing copy says "22" (grep bundle for absence of "All 12").

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
