# PR #127 (U1-U3 onboarding) — Live test plan, cv.zalize.com (worker d87eb407)

Deployed verified: index-ChcayvQt.js contains "From blank page to sent application"; Builder-CKyblFgz.js contains "Getting started", data-testid getting-started, honestcv.seen.tailor/health, honestcv.tourDone, "Dismiss".

Code evidence (commit 37329e9, Builder.tsx / Landing.tsx):
- U2 checklist shows iff neither `honestcv.tourDone` nor `honestcv.shared` in localStorage. 4 steps: fullName.trim() → JD.trim() → tailorUsed (set on Tailor button click; session state only, NOT persisted) → dlDone (init from honestcv.shared, set on any download; download also sets honestcv.shared). Done steps: green check + line-through. Dismiss sets honestcv.tourDone and hides.
- U3 badges: "New" Badge on Tailor button while !honestcv.seen.tailor and on health link while !honestcv.seen.health; clicking sets the key → badge gone, persists across reload.
- U1: landing section after hero, h2 "From blank page to sent application in three steps", 3 numbered cards (Add your experience / Tailor it to the job / Download and apply).

Pre-steps (before recording): set `honestcv.qa='1'` ONLY; remove honestcv.tourDone/shared/seen.*/resume/subscribed etc. (fresh user). Do NOT set honestcv.subscribed — but note download gate: unsubscribed → email dialog; use test email qa-beta@zalize.com if prompted (beta trial flow, verified in PR #112).

## 1. U1 Landing 3-step section
- Open / fresh: section right after hero with heading "From blank page to sent application in three steps" and 3 numbered cards (1 Add your experience, 2 Tailor it to the job, 3 Download and apply). Screenshot. Fail: section absent or fewer cards.
- 375px (CDP): / scrollWidth ≤ 375 (cards stack).

## 2. U2/U3 Builder fresh visit
- /builder fresh: "Getting started" card at top (data-testid=getting-started) with 4 numbered UNCHECKED steps + Dismiss link; "New" badge on health link; (Tailor button hidden until Target job has JD — badge check after JD paste).
- Type name "Ada QA" → step 1 gets green check + strike-through; steps 2-4 unchecked.
- Paste short JD → step 2 checks; Tailor button now enabled and shows "New" badge.
- Click Tailor (badge visible pre-click) → step 3 checks; close dialog WITHOUT Get suggestions (0 AI calls). Badge gone from button immediately.
- Click health report link (badge visible pre-click) → dialog opens; close. Badge gone.
- Reload → both badges STILL gone (localStorage persisted); checklist still visible (tourDone/shared unset), steps 1-2 still checked, step 3 UNchecked again (tailorUsed not persisted — expected per code), step 4 unchecked.
- Download PDF (through email gate if shown) → step 4 checks (dlDone). Reload → checklist GONE (honestcv.shared set).

## 3. U2 Dismiss (separate fresh state)
- Clear onboarding keys again (keep qa) → reload /builder → checklist visible → click Dismiss → card disappears instantly. Reload → still hidden (honestcv.tourDone='1').

## Regression (labeled)
- Golden path: the PDF from step 2 has real text (pdftotext).
- 375px /builder with checklist visible: scrollWidth ≤ 375, checklist card usable.
- axe A/AA in-page: / (with new section) and /builder (with checklist present): 0 violations.
- Console: zero errors on / and /builder.
- Reduced motion: no new animations expected; spot-check kill-switch still 0.01ms (CDP emulated media).
