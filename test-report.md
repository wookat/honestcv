# PR #127 — Onboarding U1-U3 live test (cv.zalize.com, worker d87eb407)

Recorded fresh-user browser run against production. `honestcv.qa='1'` set first, all other localStorage cleared (fresh client id, no onboarding keys, no `honestcv.subscribed`). All planned assertions passed. Zero AI quota used (Tailor dialog closed before Generate).

## U1 — Landing 3-step section

- "From blank page to sent application in three steps" renders directly after the hero with 3 numbered cards (Add your experience / Tailor it to the job / Download and apply) — **passed**
- 375px: scrollWidth 375 ≤ 375, no horizontal overflow — **passed**

![Landing 3-step section](https://app.devin.ai/attachments/505edb43-dff9-4e2f-a682-9e4d34c73c33/ss_83823db0.png)
![Landing at 375px](https://app.devin.ai/attachments/b1b83b57-a673-4452-8fe4-532acbe2e222/pr127-375-landing.png)

## U2 — Getting started checklist

- Fresh /builder: checklist card (`data-testid="getting-started"`) at top with 4 unchecked numbered steps + Dismiss link; both "New" badges visible — **passed**
  ![Fresh checklist + badges](https://app.devin.ai/attachments/690294bf-2a82-48c3-82f0-7699c0d46d84/ss_zoom_7767b414.png)
- Typed name → step 1 green check + strikethrough — **passed**
- Pasted JD → step 2 checks; Tailor button enables — **passed**
- Clicked Tailor, closed dialog without an AI call → step 3 checks; Tailor "New" badge gone immediately — **passed**
  ![Steps 1-3 checked, Tailor badge gone](https://app.devin.ai/attachments/f3a73dfc-b904-4720-b064-7846ad5ba26e/ss_zoom_4d173d75.png)
- Reload: Tailor badge stays gone (`honestcv.seen.tailor=1`); checklist persists; step 3 resets to unchecked — expected, `tailorUsed` is React session state, not persisted — **passed** (behavior matches code; noted as a UX observation below)
- PDF download (email gate appeared for the fresh user; unlocked with qa-beta@zalize.com, "Download anyway" past the pre-download quality nudge) → step 4 checks with strikethrough; `honestcv.shared=1`; PDF has real text (pdftotext: "Jordan Reyes") — **passed**
  ![Step 4 checked after download](https://app.devin.ai/attachments/00bd9645-378a-4c46-8311-253c2b97a55a/ss_zoom_a7fbd2ae.png)
- Reload after download → checklist hidden — **passed**
  ![Checklist hidden after download+reload](https://app.devin.ai/attachments/aa55b704-a8c4-4da1-9de1-b611a9d3e9ee/ss_39b904ae.png)
- Separate fresh state: checklist visible → Dismiss → hides instantly, `honestcv.tourDone=1`, stays hidden after reload — **passed**
  ![Dismissed instantly](https://app.devin.ai/attachments/f48a3e12-579b-4434-891c-91b54e5a67fc/ss_zoom_ec58fdcb.png)

## U3 — One-time "New" badges

- Tailor badge: visible fresh, gone on first click, gone after reload (`honestcv.seen.tailor`) — **passed**
- Health report badge: visible fresh; clicking opens the health dialog and clears the badge; still gone after reload (`honestcv.seen.health=1`) — **passed**
  ![Health dialog, badge cleared](https://app.devin.ai/attachments/01956dd8-78da-41a5-bc8f-2f14ce9954ce/ss_2037b2e0.png)
  ![Badge gone after reload](https://app.devin.ai/attachments/391588d0-b444-4d6d-ad9e-033a3e7f5bd0/ss_zoom_4d96cbdf.png)

## Regression

- Golden path: PDF download via UI, pdftotext shows real text — **passed**
- 375px /builder with checklist visible: scrollWidth 375 ≤ 375, checklist fully usable — **passed**
  ![Builder 375px with checklist](https://app.devin.ai/attachments/b31fbc08-c0b7-45f8-9a18-cc8f1b308406/pr127-375-builder.png)
- axe-core 4.10.2 A/AA: 0 violations on / and on /builder with checklist present — **passed**
- Console: zero errors (only my own test logs) — **passed**
- Reduced motion: `.animate-pop` computes 0.01ms under `prefers-reduced-motion: reduce` — kill-switch intact, no new animations — **passed**

## Observations (non-blocking)

- Checklist step 3 ("Check your ATS match…") un-checks after reload because `tailorUsed` is session-only state, while steps 1/2/4 persist (derived from resume content / localStorage). Matches the code as written; flagging in case persistent behavior was intended.
- The fresh-user download flow interposes two dialogs before the file lands (beta email gate, then "Final check before download" quality nudge). Both worked; just noting the checklist step 4 only checks after "Download anyway".

Recording: rec-fffde3d0-fe95-4485-8e50-32a5d1bf2e0e-edited.mp4
