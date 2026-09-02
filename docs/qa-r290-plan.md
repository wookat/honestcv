# QA — R290 exploratory production audit (cv.zalize.com, bundle index-iuaBfS20.js, no code delta)

Free-form depth sweep per lead. Fixture shapes verified in src/lib/resume.ts (ExperienceItem
29–41: startDate/endDate/hidden; CustomSection 180–185: title + bullets[]; skillLines 2204–2211:
"Label: a, b" per line categorizes; sectionOrder 220). Export triggers: Builder download row
(Builder.tsx ~1655: pdf/docx/txt/md via downloadText/resumeToMarkdown). All /api/ai/* intercepted
pre-network the whole session (fail or mock; zero quota). Real exports downloaded and inspected
(pdftotext, docx unzip, raw txt/md).

Master fixture "audit resume": CJK name 王小明 (Xiaoming Wang), title with **bold** mark,
summary with **bold**/*italic*/[link](https://example.com), ongoing role (endDate ""), second
experience hidden:true, categorized skills ("Languages: TypeScript, Python\nTools: Docker, AWS"),
custom section "Patents" with 2 bullets, education entry, long-word probe entry with a 90-char
unbroken URL in a bullet, jobDescription set.

## A. Editor interactions (desktop 1280×900)
A1 Entry cards: expand/collapse experience card, hide/unhide toggle on entry 2 (hidden entry shows
its badge/dimmed state; preview excludes it). A2 Marks/shortcuts: select word in summary textarea →
Ctrl+B wraps **…**; Ctrl+K inserts [sel](url) with url selected (check via selectionStart).
A3 Section order: move a section down via its reorder control; preview order changes accordingly;
optional section (Projects) opens via "(optional)" button. A4 Inline preview editing: click
preview text (if editable affordance exists) — verify whatever contract the preview offers, else
note as N/A honestly.
## B. Scoring chain
B1 Target job panel: pct/high-priority footer consistent with missing/matched chip lists.
B2 Keyword triage: card shows missing[0], "Add to Skills" appends to skills (and card advances).
B3 Score breakdown dialog: opens, priority fixes list present, a jump link scrolls to the right
editor section (activeElement/scroll position changes), Escape closes (no stuck dialog).
## C. Export chain (real downloads)
C1 PDF: text contains CJK name, no literal ** or [text](url) marks, hidden entry absent, ongoing
role shows "Present", categorized skills labels, custom section "Patents" present.
C2 DOCX: unzip document.xml — same assertions.
C3 TXT + MD: same content assertions; MD keeps markdown semantics without doubled marks.
## D. Odd states
D1 90-char unbroken URL bullet: preview + 375px page scrollWidth stays 375/1280 (no layout blowout).
D2 Education-only resume: builder renders, score panel doesn't crash, PDF export succeeds.
D3 Dark mode (theme toggle): Target job panel + assistant + triage card text contrast (spot
computed colors + screenshots).
D4 375px page-level horizontal overflow on /builder, /jobs, /checker (scrollWidth==375 each).
## Cleanup
All paused AI requests resolved; downloads inspected under /home/ubuntu/Downloads or CDP dir;
localStorage back to ["honestcv.clientId","honestcv.qa"]; empty html class.
Findings reported as P0–P3 with repro; clean checks listed. Screenshots r290_*.png.

## Results (executed on production, bundle index-iuaBfS20.js)
Findings:
- P2-1: contact Title with inline marks leaks literal `**` in PDF and DOCX exports
  ("Senior **Platform** Engineer"); preview renders bold, TXT strips. Repro: set contact
  title to `Senior **Platform** Engineer`, download PDF/DOCX. pdf.ts ~770 / docx.ts ~208
  emit c.title verbatim (no mark rendering/stripping). Evidence: r290_c1_pdf_title_leak.png.
- P2-2: /builder desktop page-level horizontal overflow at widths 1280–1440
  (scrollWidth 1377@1280, 1420@1366, 1457@1440; clean at 1512). Offender: header action
  row (Free during beta | Saved | PDF DOCX TXT MD) overflows past the viewport; reproduces
  on a fresh default resume. Evidence: r290_d1_1280_header_overflow.png / _scrolled.png.
Clean: A1 entry cards + hidden entry (badge shown, excluded from preview/exports);
A2 Ctrl+B/Ctrl+K in summary; A3 section reorder (real-mouse clicks; preview + sectionOrder
update); A4 inline preview editing (contentEditable commit to storage); B1 panel numbers;
B2 Add to Skills + triage advance; B3 breakdown + Fix→ jump + Escape; C1–C3 PDF/DOCX/TXT/MD
content (CJK, Present, Patents, skill labels, hidden absent, long URL, summary/bullet marks
rendered — only the title leak above); D1 long URL contained in preview + 375; D2
education-only resume + health report; D3 dark mode contrast (panel/breakdown legible);
D4 375 scrollWidth==375 on /builder, /jobs, /checker. Zero /api/ai requests fired
(Fetch armed whole session); localStorage/theme baseline restored.
