# R204 QA plan — per-fix "Fix in builder →" deep links from /ats-checker (index-Cawwm2_S.js)

Code evidence: src/pages/AtsChecker.tsx — `openInBuilder(anchor?)` navigates `/builder?jump=${anchor}` (or plain /builder), confirm-replace via window.confirm when saved builder resume has content; per-fix button `text-primary min-h-10 … sm:min-h-0` "Fix in builder →", anchor = f.anchor ?? ('target' for "Add missing job keywords" fix, else undefined → plain /builder). src/pages/Builder.tsx — JUMP_ANCHORS = [target, contact, summary, experience, education, skills, +optional keys]; useEffect reads ?jump, history.replaceState strips it always, unknown anchor → no jump; known → jumpToSection after 150ms. Structure-check anchors in src/lib/ats.ts (LinkedIn/contact L351, summary L357, experience, skills, education).

## W1 Bundles
Entry index-Cawwm2_S.js; /ats-checker AtsChecker-Db9Lb94c.js; /builder Builder-BVauqiXg.js. PASS iff exact.

## W2 Structure-fix deep link (primary flow)
Clear builder resume (localStorage) so no confirm fires. On /ats-checker paste weak resume WITHOUT LinkedIn/summary + example JD, Check. Assert each fix row shows "Fix in builder →" (text-primary underline). Click the button on a contact/summary-anchored structure fix. PASS iff: URL becomes /builder with NO ?jump remaining (history entry stripped), the corresponding editor section (e.g. Summary/Contact) is scrolled into view (section element top within viewport), and builder resume + JD carried over (Target job textarea contains the JD; name field = pasted resume's name). Screenshot of landed state.

## W3 Keyword fix → target
Back on /ats-checker (recheck), click "Fix in builder →" on the "Add missing job keywords" row. PASS iff lands on /builder, Target job panel in view with JD populated, no ?jump in URL.

## W4 Confirm-replace Cancel semantics
With a distinct saved builder resume (content present, e.g. name "KEEP ME"), trigger a per-fix link; window.confirm fires — auto-Cancel (override confirm → false before click). PASS iff after navigation: builder still shows "KEEP ME" resume (not replaced), but jobDescription = checker JD, and jump still happened (section in view).

## W5 Bogus jump
Navigate manually to /builder?jump=bogus. PASS iff no console error, URL stripped to /builder, page at top (no section scrolled), builder functional.

## W6 Global button regression
"Fix it in the builder — resume & job carried over" navigates to plain /builder (no ?jump), carry-over works as before.

## W7 Mobile + dark
375px: per-fix buttons computed min-height ≥40px; clicking one lands on the builder EDIT pane with the section in view; document scrollWidth 375 on both pages. Dark mode: "Fix in builder →" link color (text-primary) readable — pixel contrast ≥4.5:1. Screenshots.

## W8 Regression + cleanup
R203 Priority fixes panel + 6 dims unchanged (example flow values: +27/+3.8/+3.8, overall 65 = round(61·.7+75·.3)); R202 tiers "High priority (7)". Zero non-quota /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (production, CDP)
- W1 PASS: index-Cawwm2_S.js / AtsChecker-Db9Lb94c.js / Builder-BVauqiXg.js.
- W2 PARTIAL — **P3 gap**: every fix row shows "Fix in builder →" (text-primary underline), resume+JD always carried over and ?jump always stripped, BUT structure-check fixes from the checker never jump: `scoreResumeText` checks (src/lib/ats.ts L221-261) carry NO `anchor` field (anchors only exist on the Builder-side `scoreResume` checks L346-397), so `f.anchor` is undefined and the button navigates plain /builder. Verified: "Skills section present" fix → /builder, no replaceState('?jump'), no jump event, skills section at top 3170 (out of view). The spec's example "missing LinkedIn → contact anchor" can't occur — the checker has no LinkedIn check. Writing-dimension fixes DO jump: "Quantified impact" (anchor experience) landed with the Experience card at top 112, JD marker carried.
- W3 PASS: "Add missing job keywords" fix → /builder, Target job textarea (with JD marker) in view (top 321), no ?jump residue.
- W4 PASS: with saved resume "KEEP ME" + confirm→Cancel: resume kept (name field KEEP ME), jobDescription replaced with checker JD, jump to experience still happened.
- W5 PASS: /builder?jump=bogus → URL stripped to /builder, scrollY 0, zero window errors/unhandled rejections (hooked pre-load), builder functional.
- W6 PASS: global "Fix it in the builder" → plain /builder, JD carried, no jump (unchanged).
- W7 PASS: 375px — all 5 per-fix buttons height exactly 40px, checker & post-jump builder scrollWidth 375, jump lands on edit pane with Experience in view; dark mode link color oklch(0.68 0.16 265), pixel contrast 6.16:1.
- W8 PASS (regression): R203 example values unchanged (score 65 = 61/75 subs, fixes +27/+3.8/+3.8, 6 dims 100), R202 "High priority (7)".
- Cleanup DONE: zero non-quota /api/ai calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"].

## Tester gotcha
Clicking a per-fix button while a saved builder resume has content fires a native window.confirm that WEDGES the CDP page session (Runtime.evaluate stops responding; Page.handleJavaScriptDialog may report "No dialog"). Stub `window.confirm` before clicking, or recycle the tab via /json/close + /json/new.
