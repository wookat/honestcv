# R178 QA plan — inline underline marks `__text__` (index-eVgRZg86.js / Builder-D97ITna9.js)

Extends R177 plan/fixtures. Code: marks.ts MARK_RE + nested underline parse, wrapSelection '__', domToMarks U→`__`, markdown rewrites `__x__` → `<u>x</u>`; LintedTextarea Ctrl/Cmd+U; pdf.ts 0.5pt underline rule; docx `<w:u/>`.

## Y1 Bundles + stacked smoke
index-eVgRZg86.js + Builder-D97ITna9.js. Smoke: R177 strong/em render + Ctrl+B, R176 Priority fixes first card, R175 Group into categories, R174 meter.

## Y2 Render (1440)
Bullet: `Led __major upgrades__ with **bold** and __**bold underline**__ and ***bi*** plus literal _x_ and stray __unclosed`
- `<u>major upgrades</u>`; `<strong>bold</strong>`; nested u>strong "bold underline"; strong>em "bi"; literal `_x_` and `__unclosed` unstyled. Screenshot.

## Y3 Ctrl+U in textarea
Select word + Ctrl+U → `__word__`; again → toggled off; collapsed → no-op. Ctrl+B/I still work (regression).

## Y4 Preview contentEditable
Native Ctrl+U on word, blur → textarea gains `__word__`. Escape → value reverted AND styled runs re-rendered (no raw `__`).

## Y5 Exports
Downloads to /tmp/r178dl (browser-level ws + honestcv.shared). PDF: 0.5pt rule under underlined words (detect via pdfminer LTRect/LTLine under text), fonts unchanged, wrap ≤558pt. DOCX: `<w:u`/ on underlined runs, bold+underline both flags. TXT: no `__`. MD: `<u>text</u>` emitted, `**`/`*` verbatim.

## Y6 Score equivalence
`__Led__ X` vs `Led X`: identical dialog title scores. Wavy lint on `__Responsible for__ ...`.

## Y7 Mobile 375
Underlined runs render, scrollWidth === 375.

Cleanup: QA keys removed, baseline ["honestcv.clientId","honestcv.qa"].
