# R162 QA plan — semicircular ScoreGauge on Resume strength card (bundles index-CL679eEl.js / Builder-Cah28Tdd.js)

Code evidence (diff 7e8fb97..5d1d262, src/pages/Builder.tsx):
- `ScoreGauge` ~L654–695: root div `role="img"` aria-label `Resume strength {N} out of 100 — {verdict}`; SVG viewBox 0 0 200 118 with three arcs: 0–50 `stroke-red-400` (round cap), 50–80 `stroke-amber-400`, 80–100 `stroke-emerald-500` (round cap); needle `<line>` from (100,100) to gaugePoint(score,62); hub circle; `<text>` "0" and "100" at arc ends; centered big score `text-2xl tabular-nums` + verdict block beneath.
- Strength card ~L1769: old `role="progressbar"` bar + "{score}% — verdict" header text REMOVED; `<ScoreGauge score={strength.score}/>` inserted. "Next: …" hint and rest of card unchanged.

## H1 Bundles
Fresh cache-busted load → exactly index-CL679eEl.js + Builder-Cah28Tdd.js; baseline storage clean.

## H2 Gauge on strength card — high band (1440)
Seed standard fixture (strength ≈95). PASS iff strength card shows the semicircular gauge (screenshot): three-color arc, needle pointing near the right/emerald end, big number = strength score, verdict "Strong" beneath, "0" and "100" labels; NO old thin progress bar and NO "{score}% — verdict" text in the card header. DOM: card contains `[role="img"]` with aria-label exactly `Resume strength {N} out of 100 — Strong`, and contains NO `[role="progressbar"]`.
Record observed band colors: computed stroke of the three paths = red-400 (#f87171), amber-400 (#fbbf24), emerald-500 (#10b981).

## H3 Low band
Empty the resume (clear experience/education/skills/summary via storage + reload). PASS iff strength score <50, needle points into the left red band (needle endpoint x < 100 in SVG coords), verdict "Needs work", aria-label matches. Screenshot.
If handy, also hit mid band (50–79, verdict "Getting there", needle in the middle) with a partial fixture — report whichever two+ bands achieved.

## H4 Mobile 375
Emulate 375. PASS iff gauge fits inside strength card, `document.documentElement.scrollWidth ≤ 375` (360 quirk ok), gauge width ≤ card width. Screenshot.

## H5 Regression (desktop)
- Score breakdown dialog opens from the card's "Full health report" / breakdown link; contains Guide links (R153) and R157 "Go to entry:" chips when a weak bullet exists — spot-check presence only.
- R152 sticky health chip unchanged: "{N} · {verdict}" with aria-label.
- R161 Stack roles Off/On toggle still groups/ungroups preview.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; close emulated target; fresh desktop tab; no AI/share/payment/export/deletion.
