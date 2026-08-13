# HonestCV Round 2 (PR #6) — Live Test Plan (cv.zalize.com)

Recorded browser run on live site. NO AI calls (relay out of credit). No Paddle.
Code evidence: src/pages/Builder.tsx (useUndo ~L90, Undo2 header button, ArrowUp/Down on Experience role header & Education row, Import dialog ~L1082, ACCENT_CHOICES swatches after template buttons, finalCheckIssues + "Final check before download" dialog), src/lib/importText.ts, src/lib/templates.ts resolveTemplate() → pdf.ts uses accentColor.

## 1. Global undo
- /builder with sample resume loaded. Pass precondition: header Undo2 icon button (title "Undo (Ctrl+Z)") is DISABLED before any edit.
- Delete Role 2 (trash icon). Pass: role gone from editor+preview; undo button enabled. Click undo → Role 2 restored in editor and preview. Fail: button stays disabled or role not restored.
- Ctrl+Z path: make an edit (e.g. change name), click on a non-input area (page background) to blur, press Ctrl+Z → edit reverted.

## 2. Section reorder
- Experience Role 1 header: ArrowUp disabled, ArrowDown enabled (2 roles). Click Role 1 ArrowDown → roles swap in editor AND preview order (first company changes). ArrowDown on now-last role is disabled. Undo/second-arrow to restore.
- Education row: with 1 entry both arrows disabled (note); if sample has 1 edu, assert both disabled — otherwise swap and verify.

## 3. Import from pasted text
- Click "Import from text" (top-right of editor column). Dialog "Import from pasted text" opens.
- Paste:
```
Jordan Reyes
Software Engineer
jordan@email.com | (555) 210-4432

SUMMARY
Engineer with 6 years building web apps.

EXPERIENCE
Software Engineer at Brightlane (Jun 2023 – Present)
- Led migration of checkout flow, cutting load time 40%
- Built CI pipeline used by 12 engineers

EDUCATION
B.S. Computer Science, State University (2014 – 2018)

SKILLS
TypeScript, React, Node.js, SQL
```
- Click "Import — replaces current content (Ctrl+Z to undo)". Pass: Full name=Jordan Reyes, email/phone filled, Role="Software Engineer", Company="Brightlane", dates Jun 2023/Present, 2 bullets, education + skills filled; preview shows Jordan Reyes. Fail: fields empty/mangled.
- Click header undo → previous (sample QA) resume restored. Pass: name reverts.

## 4. Accent color swatches + PDF
- 8 colored dots after template buttons. Click the blue (#1d4ed8) swatch. Pass: swatch highlighted (border+scale), preview headings/dividers turn blue. Screenshot before/after.
- Download PDF (subscribed from last run; else qa-r1@example.com). Verify colored headings: pdftotext for text + `python3` extract of content stream / visual open of PDF page screenshot showing blue headings. Pass: PDF headings visibly blue in rendered page.

## 5. Final check before download
- Make resume incomplete: clear Skills field AND add weak bullet "Responsible for various things". Click PDF. Pass: dialog "Final check before download" lists ⚠ issues (skills check + "N bullet-quality warning(s) in Experience"); no download yet. Click "Keep editing" → dialog closes, no download.
- Click PDF again → dialog → "Download anyway" → PDF actually downloads (verify file mtime in shell).
- Fix resume (restore skills via undo/re-type, remove weak bullet) until ATS checks all green + no bullet warnings. Click PDF. Pass: NO dialog, download starts immediately. Fail: dialog appears with zero issues or blocks download.

## 6. Regression + mobile (~420px)
- Autosave "Saving…/Saved" still works while typing.
- ATS card with JD still shows Keywords/Structure sub-scores + "+ keyword" chips (observe only).
- Resize ~420px: builder single column, no horizontal overflow (scrollWidth <= innerWidth) with new undo button/arrows/swatches present.

Throughout: console clean on cv.zalize.com; verify downloads in shell (pdftotext).
