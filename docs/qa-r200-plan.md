# R200 QA plan — Sidebar template with left-gutter section labels (index-BPPGOKdN.js)

Code evidence: templates.ts L26 sideLabels, L47 'Side labels' filter, L347-357 sidebar def (accent #1e3a8a, upper, sans, divider none, left header); ResumePreview.tsx L281-288 heading absolute {left:0, top:0, width:74, overflowWrap:break-word}, L397-402 section wrapper {position:relative, paddingLeft:86, marginTop} + jumpProps; pdf.ts L629-632 x0=MARGIN+96=150pt & contentW shrink, L354-370 label drawn at x=MARGIN on first content baseline with size autoshrink ≥7 to fit gutterW=86; TemplateThumb.tsx L46-51 label at L, content x=L+24; Landing L954 / Builder L728 "25 templates".

## S1 Bundle + pSEO
Entry index-BPPGOKdN.js. /templates/sidebar 200 with thumbnail image; /templates page lists 25 template cards including Sidebar.

## S2 Gallery
Builder gallery: new filter chip "Side labels" shows exactly [Sidebar]; Sidebar thumbnail SVG has heading text at x=L(≈left edge) and content lines starting at L+24 (distinct from a non-sideLabels thumb).

## S3 Sidebar preview geometry (core)
Load example resume, select Sidebar. For each section wrapper: computed position relative, paddingLeft 86px; its h3 label absolute at left 0, width 74px, offsetTop 0 (top aligned with first content line); label color rgb(30,58,138); content elements start at x ≥ wrapper.left+86; label right edge (≤74px) < content left (86px) → no overlap. Long-heading test: rename "Experience" inline to "PROFESSIONAL EXPERIENCE HISTORY" → label wraps within 74px (scrollWidth ≤ 74+1, no intersection with content bounding boxes). Rename persists in resume.sectionHeadings. Click section-jump: clicking the section in preview scrolls/focuses corresponding editor section (jumpProps) — verify document.activeElement/scroll change. Screenshot clip of gutter layout.

## S4 Overflow
1440: preview paper renders, no layout break (screenshot). 375 (single CDP connection): document scrollWidth === 375, only section-chip scroller internally scrollable.

## S5 PDF
Download Sidebar PDF. Parse: header name text x=54 (full width); section label texts (EXPERIENCE, EDUCATION, SKILLS…) at x=54 with accent color 30/58/138≈(0.118,0.227,0.541); content text x=150; extracted text order (pdfminer/pdftotext) heading precedes its section content; force multi-page (sample + extra entries) → labels/content sane on page 2, no label orphaned at page bottom without content. pdftoppm render pixel check + screenshot.

## S6 Invariance
ATS score (JD pasted) identical classic vs sidebar; TXT+MD sha256 identical across the two templates.

## S7 Regression
Circuit preview still renders entry hairlines (pixel row in clip); R199: /builder @375 scrollWidth 375, "by Zalize" display:none; dark mode builder header/preview sane (screenshot).

## S8 Cleanup
Zero /api/ai/* generation calls (quota GET excluded); final localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production, bundle index-BPPGOKdN.js)
- S1 PASS: entry index-BPPGOKdN.js; /templates/ lists 25 unique template slugs incl. sidebar (ItemList numberOfItems:25, "All 25 RezUp resume templates" meta); /templates/sidebar 200, title "Sidebar Resume Template — Free to Use Online | RezUp", inline SVG thumb with labels x=10 (#1e3a8a) and content x=34.
- S2 PASS: "Side labels" filter = exactly ["Sidebar"]; gallery thumb SVG labels x=10 fill #1e3a8a, content x=34 (r200_filter_side_labels.png).
- S3 PASS: every side-label h3 absolute {left:0, top:0, width:74px, color rgb(30,58,138)}; wrapper position:relative paddingLeft:86px; content offset 59px at 0.69 preview scale; overlap=false all sections. Long heading "PROFESSIONAL EXPERIENCE HISTORY" wraps to 3 lines within 74px, no overlap (r200_longheading_clip.png); rename persisted to sectionHeadings and cleanly reverted. Section jump: clicking Education section (title "Edit Education") scrolled editor to Education (top 61px in view).
- S4 PASS: 1440 layout fine (r200_sidebar_1440.png, r200_sidebar_gutter_clip.png); 375 emulation scrollWidth 375 === innerWidth, "by Zalize" display:none (r200_mobile_375.png).
- S5 PASS: PDF labels x=54.0pt accent (0.118,0.227,0.541)=#1e3a8a, content x=150.0pt, header/contact full width at x=54; pdftotext default AND -raw order = heading then content (pdfminer clusters SUMMARY/EXPERIENCE labels adjacently — extraction-tool artifact, not file order); multipage (8 exp entries → 2 pages): page 2 opens with EDUCATION label at first content baseline, no orphaned labels. Renders r200_pdf_sidebar-1.png, r200_pdf_multipage_p2-2.png.
- S6 PASS: ATS 99/100 identical sidebar↔classic; TXT sha256 938542b7… and MD bcae2470… byte-identical across templates.
- S7 PASS: Circuit renders its expected 1 divider (2-job example) — r200_r198_regression_clip.png; R199 mobile header intact; dark mode: html.dark, paper stays rgb(255,255,255) with content visible (r200_dark_builder.png).
- S8 DONE: zero /api/ai/* generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"] (also purged tester-created resumeHistory/templateRecents keys).
