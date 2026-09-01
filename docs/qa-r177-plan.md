# R177 QA plan — inline bold/italic marks in bullets (index-DTArPDp1.js / Builder-Ceq56NEP.js)

Code evidence: src/lib/marks.ts (MARK_RE, wrapSelection toggle incl. surrounding-mark removal, domToMarks); LintedTextarea.tsx onKeyDown Ctrl/Cmd+B/I → applyMark (native setter + input event), wavy backdrop uses checkBullet which strips marks (guidance.ts:38); ResumePreview.tsx MarkedText renders `<strong>/<em>`, InlineText onBlur commits domToMarks, Escape restores `shown`; exports: Builder.tsx:1394-1395 (MD keeps marks via resumeToMarkdown, TXT via resumeToPlainText strips at resume.ts:2402), pdf.ts:406 mixed-run rendering, DOCX TextRuns. Bullet textarea id `exp-{entryId}-bullets`. Downloads: intercept via CDP Page.setDownloadBehavior to /tmp/r177dl and inspect bytes (allowed this round — exports are the feature).

## X1 Bundles + stacked smoke
Serve exactly index-DTArPDp1.js + Builder-Ceq56NEP.js. Smoke: R174 meter span, R175 Group-into-categories (10-skill fixture), R176 Priority fixes panel first card in Score breakdown dialog.

## X2 Render + literal asterisk (1440)
Seed resume; set bullet textarea (#exp-e1-bullets) via real input to:
`Led **major upgrades** with *careful planning* and ***bold vision*** at 3 * the speed`
- Preview bullet contains `<strong>major upgrades</strong>`, `<em>careful planning</em>`, `<strong><em>bold vision</em></strong>`; literal ` 3 * the speed` text intact (no styling, asterisk visible). Screenshot preview bullet.

## X3 Ctrl+B/Ctrl+I toggle in textarea
Select "major" (plain word inserted for test) via setSelectionRange + real CDP keydown Ctrl+B:
- value gains `**major**`; same selection again (select `**major**`) + Ctrl+B → back to `major`.
- Ctrl+I with collapsed selection → value unchanged (no-op).
- Wavy-lint regression: line `**Responsible for** doing things daily` still shows wavy underline span (backdrop span has decoration-wavy class) — marks stripped before lint.

## X4 Preview inline edit round-trip
Click a preview bullet (contentEditable span role=textbox), select one word, native Ctrl+B (document.execCommand happens via browser), blur:
- textarea value now contains `**word**`.
- Escape path: focus again, type garbage, press Escape → textarea value unchanged.

## X5 Exports
Enable CDP download to /tmp/r177dl. Bullet fixture with long marked bullet (>1 line wide).
- PDF: download {name}-resume.pdf; pdffonts/pypdf shows Bold + Oblique/Italic font variants embedded; extracted text contains the bullet words without asterisks; visual: render page 1 to PNG (pdftoppm) — bold/italic glyphs visible, wrapped lines don't overlap. Screenshot of PNG.
- DOCX: unzip word/document.xml → the bullet paragraph has multiple w:r runs with <w:b/> and <w:i/> on the right words.
- TXT: file contains bullet text with zero `*` characters.
- MD: file preserves `**` / `*` marks verbatim.

## X6 Score equivalence
Resume A bullets plain (`Led X 42%...`), Resume B same with `**Led**` bolded: ATS score and Writing score in the Score-breakdown dialog title identical for A and B.

## X7 Mobile 375
Edit pane: bullet textarea with marks visible, no horizontal overflow (scrollWidth === 375); Preview & score pane: marked bullet renders styled. Screenshot.

Cleanup: remove honestcv.resume/QA keys + /tmp/r177dl; baseline exactly ["honestcv.clientId","honestcv.qa"]. No AI/share/payment.
