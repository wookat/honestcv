# QA — R293 production (cv.zalize.com, expected index-BKSOPwRT.js / Builder-DbLHBxhC.js / pdf-BN1S3Qc-.js / docx-CxbI49BD.js)

Delta: Margins stepper in Builder design toolbar (Builder.tsx 6500–6530, MARGIN_STEPS
narrow/normal/wide, labels 0.5″/0.75″/1″), resume.pageMargins (undefined=normal, not
serialized; resume.ts 235/354/357: PAGE_MARGIN_PT 36/54/72pt), preview pagePad
round(32*pt/54)=21/32/43px (ResumePreview.tsx 438), PDF w.setMargin(pageMarginOf) (pdf.ts
734), DOCX pgMar sides round(864*pt/54)=576/864/1152 twips, top/bottom 720*scale=480/720/960
(docx.ts 79–81). Career-doc/letter exports unchanged (docx.ts 771 hardcoded).

Method: CDP (port 29229, r283_lib), Fetch armed on *api/ai/* all session (zero AI),
subscribed/shared keys to skip email gate, "Download anyway", downloads /home/ubuntu/qa/
r293_dl. Fixture: content-heavy resume (name 王小明 QA, summary, 2 experience entries with
many bullets, skills, education) so wide→narrow can change page count.

## M1 Stepper anatomy (desktop, light)
Design toolbar shows "Margins" label; value text "0.75″"; − and + buttons: at default both
enabled? No — plan: default normal → − enabled, + enabled. Click − once → "0.5″", − now
disabled; click + twice → "1″" (via 0.75″), + now disabled. Screenshot at 0.5″ and 1″.

## M2 State + preview padding
At 0.5″: resume page container computed padding == 21px; localStorage honestcv.resume
contains "pageMargins":"narrow". At 1″: padding 43px, "pageMargins":"wide". Back to 0.75″:
padding 32px and raw honestcv.resume string contains NO '"pageMargins"'.

## M3 PDF geometry (real downloads)
Narrow PDF: pdfminer min x0 of text chars ≈36pt (±2), max y1 ≈ 792−36 (±3). Wide PDF: min
x0 ≈72 (±2), top ≈792−72 (±3). Regression default PDF: min x0 ≈54 (±2). Page count wide ≥
narrow, and with the content-heavy fixture expect wide>narrow (report actual counts).

## M4 DOCX pgMar (real downloads)
Narrow DOCX document.xml <w:pgMar>: w:left=w:right=576, w:top=w:bottom=480. Wide: 1152/960.
Default: 864/720.

## M5 Auto-fit with non-default margin
At narrow (or wide), click "Auto-fit" in the preview header → no error; a sensible toast/
message about fit; page still renders; pageMargins value unchanged.

## M6 Regression steppers
Text/Spacing/Sections steppers still respond (click one +/- and observe value change), at
default margins.

## M7 375px + dark
375×812: documentElement.scrollWidth <= 375, Margins stepper present in wrapped toolbar
(screenshot). Dark mode: Margins label/value legible (light color on dark bg), screenshot.

## Cleanup
Remove resume/resumeHistory/templateRecents/subscribed/shared etc.; baseline exactly
[clientId, qa]; empty html class; zero /api/ai requests. Screenshots r293_*.png.

## Results (executed on production, bundles index-BKSOPwRT.js / Builder-DbLHBxhC.js / pdf-BN1S3Qc-.js / docx-CxbI49BD.js verified)

- M1 stepper anatomy — PASS. Default "0.75″" both buttons enabled; − once → "0.5″" with − disabled; + twice → "1″" with + disabled. Screenshots r293_m1_narrow.png / r293_m1_wide.png.
- M2 preview padding + serialization — PASS except one finding. Padding 21/32/43px at narrow/normal/wide; "pageMargins":"narrow"/"wide" serialized.
  **FINDING (P3): returning to 0.75″ leaves `"pageMargins":"normal"` in honestcv.resume instead of removing the key** — breaks the stated byte-compat-default contract. Source: Builder.tsx 6508/6528 `set('pageMargins', MARGIN_STEPS[i±1])` never maps 'normal'→undefined.
- M3 PDF geometry — PASS. pdfminer min glyph x0: narrow 36.0pt / default 54.0pt / wide 72.0pt (exact). Top glyph y1 742/724/706 (deltas exactly 18pt per step; constant ~14pt ascent offset from the 36/54/72 margins). Page counts all 1 with base fixture; after growing content, preview length wide=1.20 pages vs narrow=0.94 page (margin-sensitive page counting confirmed; r293_m3_narrow_length.png).
- M4 DOCX pgMar — PASS (exact): narrow 576/576/480/480, default 864/864/720/720, wide 1152/1152/960/960.
- M5 Auto-fit at wide — PASS. No error; "Fits 1 page — set large text, relaxed spacing"; pageMargins stayed "wide". r293_m5_autofit.png.
- M6 stepper regression — PASS. Text 108%→100% (fontScale m), Sections 1.00→0.60 (tight) via real clicks; Spacing verified changed by Auto-fit (relaxed). Default PDF x0 54.0pt unchanged. r293_m6_steppers.png.
- M7 375px + dark — PASS. scrollWidth=375; Margins stepper lives in the preview pane → visible after tapping the "Preview & score" mobile tab, toolbar wraps (Margins row y=1261 below Text row y=1226, right edge 342<375). Dark: label oklch(0.68 .02 260) / value oklch(0.93 .01 260) on bg oklch(0.16 .015 260). r293_m7_375.png / r293_m7_dark.png.
- Safety/cleanup — PASS. Zero /api/ai/* requests all session; localStorage exactly [clientId, qa]; empty html class. r293_cleanup_final.png.

Harness notes: 1600px viewport shows full export buttons (no dropdown) — download via them; one stepper click missed because the click point was measured before scrollIntoView settled (fixed with longer settle).

## R293b — P3 fix re-verification (bundles index-DJ2vZh9q.js / Builder-DXPhO1-F.js confirmed)
- narrow → 0.75″: raw honestcv.resume has NO "pageMargins" key; stepper 0.75″, both buttons enabled — PASS (r293b_normal_from_narrow.png)
- wide → 0.75″: same, key removed — PASS (r293b_normal_from_wide.png)
- Regression: narrow serializes "pageMargins":"narrow" (− disabled), wide serializes "wide" (+ disabled) — PASS
- Zero /api/ai/* requests; cleanup baseline [clientId, qa], empty html class — PASS
