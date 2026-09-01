# R170 P3 polish spot-check (PR #386, commit c0e2dbe, bundles index-B8Yx8_Qt.js / Builder-xTge6xRp.js)

Code evidence: resume.ts isLinkLike(v) = v.length>0 && !v.includes(' ') && v.includes('.'); Builder.tsx ~2046 icon renders only when isLinkLike(normalizeContactLink(...)); aria-label strips "(optional)".

Desktop 1440 only, existing CDP setup, fixture /tmp/r1371_before.json.

## S1 Bundles
Cache-busted load → exactly index-B8Yx8_Qt.js + Builder-xTge6xRp.js.

## S2 Free text → no icon
`c-website` = `see my portfolio`, blur. PASS iff value unchanged AND no `<a>` in the website row (DOM 0 anchors + screenshot shows input without icon).

## S3 Link-like values → icon with clean aria-label
`c-website` = `jordanreyes.dev` → icon present, aria-label EXACTLY `Open Website in a new tab`, href `https://jordanreyes.dev`.
`c-linkedin` = `linkedin.com/in/jordan-reyes` (via bare-handle blur, doubles as S4) → aria-label EXACTLY `Open LinkedIn in a new tab`, href `https://linkedin.com/in/jordan-reyes`, target=_blank, rel=noreferrer. Screenshot shows both icons.

## S4 Blur normalization regression (one case)
Type bare `jordan-reyes` in `c-linkedin`, blur → value exactly `linkedin.com/in/jordan-reyes`.

Cleanup: remove honestcv.resume/resumeHistory; localStorage exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab.
