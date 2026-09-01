# R184 QA plan — hover a bullet suggestion highlights the offending line (index-BzCZ1psC.js)

Delta: LintedTextarea `highlightLine` prop → the R168 backdrop span for that line gains bg-amber-200/60; BulletGuidance `onHoverLine` fired from each "⚠ Line N" li (mouseenter/mouseleave) and the "Fix line N with AI" button (focus/blur); Builder wires Experience/Projects/Involvement through one hlLine state.

## H1 Bundle
Serve exactly index-BzCZ1psC.js (+ lazy Builder chunk).

## H2 Hover highlight (1440, Experience)
Seed exp bullets: "i was responsible for stuff" / "worked on things" / "Cut costs by 30%". CDP mousemove onto line-1 warning li → only line 1 backdrop span has amber bg; move to line-2 warning → highlight moves; mouse out → no amber span.

## H3 Keyboard path
Focus "Fix line N with AI" button → same amber highlight; blur → clears.

## H4 Projects + Involvement parity
Repeat H2 quickly on a proj-<id> and inv-<id> bullets field.

## H5 Coexistence
Amber span retains wavy-underline class; line wrapping (span rects) unchanged with/without highlight; textarea still editable (type + select) while highlighted.

## H6 Mobile 375
Editor pane with flagged bullets + guidance list: scrollWidth === 375; guidance renders.

## H7 Smoke
R183: save a job on /jobs → linked copy auto-created. R182: companyInfo input + italic preview line.

## H8 Cleanup
Baseline exactly ["honestcv.clientId","honestcv.qa"]. No AI calls.
