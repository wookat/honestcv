# I1-I3 batch + cover-letter AI smoke — live test plan (cv.zalize.com, main 3f1b1e5)

Deployment verified: index-CuwsBfRO.js has "three steps"; Builder-CXizfefx.js has "free AI rewrite", "ai/quota", "getting-started"; /about/ 200; /guides/volunteer-work-on-resume/ 200 with TOC anchors + listed twice on /guides/ hub.

Code evidence: api.ts fetchAiQuota (GET /api/ai/quota with x-client-id from `honestcv.clientId`, worker returns freeRemaining without KV write); Builder.tsx L320/1641 footer `{freeLeft} free AI rewrites left` renders when quota fetched and not unlocked (pre-AI-call via useEffect); useDebouncedSave adds pagehide/visibilitychange flush; cover-letter dialog busy line L2477 "Usually takes 10–20 seconds — the draft appears here for you to edit." with Writing… button; I3 restores Landing 3-step section, getting-started checklist (data-testid, keys honestcv.tourDone/shared/seen.tailor/seen.health; tailor step now persists), /about + footer About link (Layout.tsx L43).

State: honestcv.qa=1 always. Fresh-user state = remove honestcv.resume/tourDone/shared/seen.tailor/seen.health/subscribed and set NEW honestcv.clientId (random) for a fresh quota.

## 1. I1b quota counter before any AI call (fresh client)
- Fresh state → /builder. Footer shows "N free AI rewrites left" (expect N=limit, e.g. 5) WITHOUT any AI call. Fail: no counter until an AI call (old behavior).
- Reload twice → counter value unchanged (GET does not decrement). Record /api/ai/quota response JSON `{freeRemaining: N}` via network/console evidence.

## 2. I1a autosave flush on hide
- In /builder edit Full name to a marker (e.g. "FlushTest"), within <400ms of typing switch tab/minimize (visibilitychange hidden) then reload → localStorage honestcv.resume contains marker. Deterministic variant: type marker then immediately reload (beforeunload/pagehide flush). Fail: field reverts to previous value after reload.

## 3. I3 onboarding merged with new Builder (main risk)
- Landing: "From blank page to sent application in three steps" section after hero, 3 numbered cards; also visible at 375px, scrollWidth ≤ 375.
- Fresh /builder: getting-started checklist visible (4 unchecked steps + Dismiss) AND coexists with ATS explainability card ("How this score is calculated" details) — both render, no layout break.
- Both "New" badges visible (Tailor button, health report link).
- Type name → step 1 checks. Paste JD → step 2 checks. Click Tailor, close dialog without call → step 3 checks + persists after reload (new fix) + Tailor badge gone after reload. Open health report → badge gone after reload.
- PDF download via email gate (qa-beta@zalize.com; privacy paragraph + Privacy policy link still present) → step 4 checks; reload → checklist hidden (honestcv.shared).
- Separate fresh state: Dismiss hides checklist instantly + after reload (honestcv.tourDone).
- 375px /builder fresh: checklist + bottom Edit/"Preview & score" switcher both present, panes toggle, scrollWidth ≤ 375.
- /about/: 200, renders (h1 + content), footer "About" link on / footer.

## 4. Cover-letter busy line + quota decrement (ONE AI call)
- With example resume + JD pasted, note footer counter N. Open "Cover letter" dialog → Generate → while busy, button "Writing…" + role=status line "Usually takes 10–20 seconds — the draft appears here for you to edit." (screenshot while busy). Result appears (honest draft, non-empty).
- Footer counter afterwards = N-1 (may need reload). Fail: no busy line, or decrement ≠ 1.

## 5. I2 guide (mostly shell/CDP)
- /guides/volunteer-work-on-resume/ in browser: renders, click a TOC anchor → jumps to section. Listed on /guides/ hub (link visible). 375px scrollWidth ≤ 375. axe A/AA 0 violations on the guide page.

## 6. Regression
- axe A/AA 0 violations on / and /builder (desktop + 375px with checklist + bottom bar).
- Console: zero real errors on / and /builder.
- Golden path covered by #3 PDF download (real text via pdftotext).

Budget: exactly 1 AI call (cover letter). Recording annotated per test.
