# R199 QA plan — mobile builder header overflow fix (index-D9j14iCd.js)

Code evidence: commit d5cbd92 — Layout.tsx L111 tagline span now `hidden … sm:inline`; Builder.tsx L1466 header action cluster `gap-1 sm:gap-2`. Prior round measured /builder scrollWidth 388 at 375px (offenders: header button row right=388, fixed bottom bar w=388).

## H1 Bundle
Entry index-D9j14iCd.js served.

## H2 /builder @375 (core — previously 388)
Emulate 375x812. Assert: document.documentElement.scrollWidth === 375; enumerate elements with getBoundingClientRect().right > 376 — allowed only descendants of the overflow-x-auto section-chip scroller (its own clientWidth ≤ 375, scrollable: scrollWidth > clientWidth); fixed bottom Edit/Preview bar width === 375 and right === 375; hamburger button fully inside viewport (right ≤ 375) with size ≥ 40px; tagline "by Zalize" computed display:none; header buttons (History/Assistant/download menu) each ≥40px in one dimension and right ≤ 375. Screenshot.

## H3 Other pages @375
/, /dashboard, /jobs, /ats-checker: scrollWidth === 375 (or === viewport), tagline hidden. Screenshots (spot).

## H4 Desktop 1440
/builder: tagline "by Zalize" visible (display inline, on-screen pixels), action cluster computed gap 8px (sm:gap-2), PDF/DOCX buttons + save state present. Screenshot.

## H5 Dark spot check
Dark theme via UI toggle: header legible at 1440 and 375 (screenshot each; tagline visible @1440, absent @375).

## H6 Regression (R198)
Circuit template with multi-entry resume: 4 inline `1px solid rgb(228,228,228)` dividers in preview; gallery "Ruled entries" filter = exactly [Circuit, Ledger].

## H7 Cleanup
Zero /api/ai/* generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production)
- H1: entry index-D9j14iCd.js served — passed.
- H2 /builder @375 (was 388): scrollWidth 375 === visualViewport 375. Only elements past x=376 are descendants of the overflow-x-auto section-chip scroller (clientWidth 277, scrollWidth 490 → still scrollable+clipped). Fixed bottom Edit/Preview bar width/right = 375. Hamburger 40x40 @right 367. Tagline span display:none. Visible header buttons: theme 40x40@167, History 40x40@211, Assistant 40x40@255, Download 64x40@323, Menu 40x40@367 — all ≥40px, all ≤375 — passed.
- H3 @375: /, /dashboard, /jobs, /ats-checker all scrollWidth 375 with tagline display:none — passed. (Caveat: emulation reverts per-websocket — re-assert innerWidth===375 after every navigate.)
- H4 1440: "by Zalize" span visible in header (rect x237 w39; 70 muted-gray text pixels confirmed in screenshot), action cluster class `gap-1 sm:gap-2` computes gap 8px, PDF button present. Note: computed display is "block" (not "inline") at ≥640px — visually identical inline-flow position, cosmetic only, not a finding.
- H5 dark: dark @375 tagline none; dark @1440 tagline visible — passed (screenshots).
- H6 R198 regression: Ruled entries filter = exactly [Circuit, Ledger]; Circuit on the 2-job example resume renders 1 divider (entries−1) confirmed as a gray pixel row in the clipped preview screenshot — passed.
- H7: zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — done.
