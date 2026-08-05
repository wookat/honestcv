# HonestCV Round 3 (PR #8) — Live Test Report (cv.zalize.com, version 4c106ab1)

Recorded browser run against the live deployment after a hard refresh (bundle `index-CDLeJfQ6.js` confirmed to contain Minimal/Elegant/Engineer + "Keyword match" strings before testing). AI buttons skipped per instructions (relay out of credit). Downloads verified in shell.

## 1. Templates 4 → 8 — ✅ PASS

Builder shows 8 template buttons (Classic, Modern, Compact, Executive, Minimal, Bold, Elegant, Engineer). Each new template restyles the live preview:

| Minimal — left header, no dividers | Bold — UPPERCASE name, thick blue rules |
|---|---|
| ![Minimal](https://app.devin.ai/attachments/aa4080d9-d21c-4701-8a7a-c371ee423bd3/ss_zoom_cb80f2e8.png) | ![Bold](https://app.devin.ai/attachments/3f409243-8ceb-417d-9174-bf6b98147a38/ss_zoom_4454ae02.png) |

| Elegant — left serif header, Title-case headings | Engineer — left sans header, thin rules |
|---|---|
| ![Elegant](https://app.devin.ai/attachments/ef75f42b-858c-45ec-8cff-a0579f40e903/ss_zoom_a14bdb30.png) | ![Engineer](https://app.devin.ai/attachments/79b59fb8-fa40-4f10-b87c-872da9d0fb2f/ss_zoom_e02efe74.png) |

Regression: Classic still renders a **centered**, normal-case header — old templates unchanged:

![Classic centered (regression)](https://app.devin.ai/attachments/6940bbdc-762c-47da-b1d3-b0b17c996561/ss_zoom_5db80a29.png)

Note: the resume had a custom accent (#1d4ed8 from the Round 2 run) which by design overrides template accent colors, so Elegant/Engineer showed blue rather than purple/green accents in the preview. Alignment / name case / heading case / divider style — the new Round 3 axes — were all verified per template.

## 2. Bold header carries into PDF + DOCX — ✅ PASS

- **PDF** (`~/Downloads/qa-round1-resume (4).pdf`): rendered page shows the UPPERCASE name at the left margin with thick blue rules; `pdftotext` extracts `QA ROUND1` as real text.
- **DOCX** (`~/Downloads/qa-round1-resume (1).docx`): `word/document.xml` contains `QA ROUND1`, no `w:jc val="center"` near the header — all `w:jc` values are `left`.

![Bold PDF — left-aligned uppercase header, thick blue rules](https://app.devin.ai/attachments/46b4b755-3ae5-4501-9384-27f90329aa7e/boldpdf-1.png)

## 3. /ats-checker sub-scores — ✅ PASS

- Resume only (no JD): total 67/100 with **"Structure 67/100"** plus the hint "Add a job description to get a keyword match score." — no Keyword span.
- After pasting a JD: **"Keyword match 27/100"** and **"Structure 67/100"** both render under the total (39/100).

| No JD — Structure only + hint | With JD — both sub-scores |
|---|---|
| ![No JD](https://app.devin.ai/attachments/fe57dd2c-0ee5-46f1-8f45-724ede3911b8/ss_89190e00.png) | ![With JD](https://app.devin.ai/attachments/8e731233-4b6c-41a7-a831-947c730f8488/ss_3d9e6eff.png) |

(Test-input artifact: my typed resume text lost two characters — "EUCATION"/"SKILL" — which is why the two structure checks show red; this usefully demonstrated the heading checks and is not a product issue.)

## 4. /templates pSEO pages — ✅ PASS

Shell check: `/templates/{minimal,bold,elegant,engineer}` all HTTP 200 (after trailing-slash redirect) with distinct titles ("Minimal ATS Resume Template — Free to Use Online | HonestCV" etc.). `/templates/bold` opened in the browser: full copy, "Use the Bold template free" CTA to /builder, and cross-links to the other 7 template pages.

![/templates/bold](https://app.devin.ai/attachments/7f4ec561-64e4-4d1a-abdc-45d34dc97ab3/ss_f7515533.png)

## 5. Mobile UX walkthrough (~420px window) — ✅ PASS (2 minor usability notes)

Walked landing → builder → edit → template row → reorder/undo taps → PDF tap → /ats-checker at a narrow window (~440px outer):

- Landing hero + "Start free — no sign-up" CTA stack cleanly; CTA tap opens /builder.
- Builder is single-column; editing Full name updates the preview live.
- Template row wraps to 2 rows of chips + a swatch row; all 8 templates + 8 swatches reachable, no clipping. No horizontal overflow (`scrollWidth 497 ≤ innerWidth 500`).
- Reorder arrow tap swapped Role 1/2 in editor **and** preview; header undo tap restored the order — targets were tappable without mis-taps.
- PDF tap downloaded immediately (`q-mobile-r3-resume.pdf`, real text verified via pdftotext; no dialog since already subscribed and resume clean).
- /ats-checker renders single-column at mobile width with usable textareas.

| Template row + swatches wrap at mobile | Reorder tap swaps roles |
|---|---|
| ![Template wrap mobile](https://app.devin.ai/attachments/11551359-bceb-4682-b1f2-8070b5437e3c/ss_03277f26.png) | ![Reorder mobile](https://app.devin.ai/attachments/e600920d-8d7d-48f9-9b47-26093045bfec/ss_zoom_ba112856.png) |

| Landing at mobile | PDF downloaded from mobile builder |
|---|---|
| ![Mobile landing](https://app.devin.ai/attachments/3f29e148-a5d0-4040-a8cd-5aa759dd52ed/ss_c82e3a3f.png) | ![Mobile PDF download](https://app.devin.ai/attachments/384e6f0b-4279-4758-8858-a344ef939697/ss_542bfc07.png) |

**Usability notes (not failures):**
1. The first accent swatch (#1a1a1a black) wraps up onto the second template row, sitting right after the "Engineer" chip — it reads like a 9th template dot rather than the start of the color row: ![swatch wrap](https://app.devin.ai/attachments/0f2e2c76-6e77-4f6d-8821-35589e686a62/ss_zoom_4e5c9d55.png)
2. Reorder/undo/delete icons are ~28–32px tap targets — workable but at the small end for touch; no mis-taps occurred during the walkthrough.

## Console
No console errors observed on cv.zalize.com during the run.

## Not tested (intentional)
All AI buttons (relay out of credit), Paddle checkout (free mode), DOCX from mobile, email-gate first-subscription flow (already subscribed in this browser from Round 2 — download gating regression not re-exercised).

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-484edc9d-f023-4d0b-b50c-52c274556964/rec-484edc9d-f023-4d0b-b50c-52c274556964-edited.mp4`
- Downloads: `~/Downloads/qa-round1-resume (4).pdf` (Bold desktop), `~/Downloads/qa-round1-resume (1).docx` (Bold), `~/Downloads/q-mobile-r3-resume.pdf` (mobile)
