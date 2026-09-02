# QA plan — R278 headline inline marks (PDF + DOCX) — production cv.zalize.com

Expected bundle `index-GeGNQQYo.js` / `pdf-DcmywZ_l.js` / `docx-ADjafAbX.js` (confirm from
exporting page resources). Zero non-quota AI; CDP screenshots (recording down since R166; attempt
noted); restore baseline ["honestcv.clientId","honestcv.qa"] + system theme at end.

Code-traced (PR #496, commit 30bbea3): pdf.ts titleLine():276–300 — marked left column measures
fit via stripInlineMarks; two-column path uses drawRuns(left, size, 0, …, {fonts:{regular:bold},
maxWidth:leftMax}) and drawText(right dates italic soft) at same y baseline; overflow path
richText bold-base. docx.ts headRuns():151–166 — bold base + italics/underline/hyperlink per run;
mark-free path exact old single bold TextRun. Sites: role, grouped company, involvement role,
degree, coursework name, award name, publication title, reference/agency names, military rank.

## H1 — Marked headlines fixture (primary)
Seed: experience role `**Senior** __Engineer__` with startDate `Jan 2020` (two-column titleLine),
education degree `*M.S.* in __CS__` (school UT, dates), award name `Best __Paper__ Prize`
(org ACM, date 2024), summary `Led work with __rigor__.` (R277 glue regression). Download PDF+DOCX.
- PDF pdftotext: zero literal `**`/`__`/`*` tokens file-wide (old build printed `**Senior**
  __Engineer__` literally); contains `Senior Engineer`, `M.S. in CS`, `Best Paper Prize`; the
  line containing `Senior Engineer` ALSO contains `Jan 2020` (pdftotext -layout) — dates share
  the baseline (two-column path intact).
- PDF raster 150dpi: role words bold (ink density ≥1.4× a regular-weight body word); short
  underline rule spanning exactly `Engineer` (role) and `CS` (degree) and `Paper` (award);
  `M.S.` segment drawn in an italic-family face → pdffonts must list a bold-italic or italic
  face used beyond dates (weak; primary italic proof = zoom crop eyeball, else inconclusive).
- R277 glue regression: `rigor.` glued (grep `rigor\.` =1, no `rigor .`).
- DOCX document.xml: zero literal marks; role paragraph runs all bold, `Engineer` run has w:u,
  degree para has an italics run `M.S.` (bold+i), `CS` bold+u; award `Paper` bold+u.
- Right-tab dates still present in DOCX role/degree paragraphs (`Jan 2020`).

## H2 — Mark-free regression
Plain resume (role `Engineer`, degree `BSc CS`, no marks): PDF pdftotext lines intact with dates
on same line; zero underline rules on page; DOCX headline runs single bold TextRun (no w:u/w:i in
headline paras); byte-clean (no artifacts).

## H3 — TXT/MD sanity (unchanged paths)
Marked fixture: MD headline lines keep `**`…`<u>`? (resumeToMarkdown: `__`→`<u>`, `**` passes);
TXT strips all marks; both files contain zero raw `__`.

## Discipline
Byte + pixel checks; `__aiReqs` [] throughout; ambiguous → inconclusive; screenshots r278_*.
Cleanup: baseline keys only, system theme.

## Findings (appended after run)
- H1 PDF: 0 literal marks; -layout shows `Senior Engineer · Acme    Jan 2020 – Present` on ONE line (degree/award lines ditto); underlines at exactly Engineer (row468:179-263 vs word 179-264), CS (607:178-204), Paper (805:273-294), rigor (356); Senior NOT underlined; role words ink 6.38/6.46 vs 4.65-5.33 body; mutool stext: `M.S.` = Times-Italic, rest of degree + role = Times-Bold — PASS
- H1 DOCX: 0 literals; role runs all bold w/ Engineer w:u; M.S. b+i; CS b+u; Paper b+u; dates tab runs intact — PASS
- H2 mark-free: PDF two-column lines intact, 0 underline rules; DOCX headline paras 0 w:u, single bold runs (only dates italic) — PASS
- H3: MD `### **Senior** <u>Engineer</u> — Acme`, 0 raw `__`; TXT fully stripped — PASS
- R277 glue regression `rigor.` =1 — PASS; bundles index-GeGNQQYo.js / pdf-xdGNttkJ.js (≠ expected pdf-DcmywZ_l.js, flagged) / docx-ADjafAbX.js; ai [], errs [], baseline keys, system theme — PASS
