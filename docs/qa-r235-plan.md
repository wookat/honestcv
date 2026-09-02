# R235 QA plan — separate Filler sounds metric (um/uh/er/ah/hm/hmm) vs Quick fillers

Code evidence: src/lib/interviewAnalysis.ts — QUICK_FILLER_PHRASES now 12 phrases without sounds (68–81); new analyzeFillerSounds (119–136): FILLER_SOUNDS=[um,uhm,uh,er,ah,hm,hmm], \b boundaries gi, perMinute=round(total/(el/60)*10)/10 when el≥5 & total>0, band good ≤2 / high >2 / null untimed. Builder.tsx 7891–7894 fillerSounds memo; row render 8471–8491: `Filler sounds: “um” ×2, …` + timed suffix ` — X/min, within the 1–2 per minute guideline.` (emerald when good) or ` — X/min — aim for no more than 1–2 per minute; pause instead of filling silence.` (amber when high); untimed ends with `.` amber (band null ⇒ amber class). Bundles: index-DLY8gzal.js / Builder-D26y3HFx.js.

Fixtures (expectations computed locally with node against exact library code):
- M (mixed, 25 words): `Um, I think we kind of did it, um, you know. Ah, the summer project in Berlin went ahead. Hmm, it erred, uh, aha hmph.` → sounds: um ×2, uh ×1, ah ×1, hmm ×1, total 5; @90s → 3.3/min high. Quick fillers: kind of ×1, i think ×1, you know ×1 (no atStart) — NO um/er in that row. Negatives inside M: summer/Berlin/ahead/erred/aha/hmph add nothing (er⊄erred/Berlin, ah⊄ahead/aha, hm⊄hmph, um⊄summer).
- A (20 words): `Um, I led the project and we shipped it early. Uh, results improved by twenty percent overall, ah yes indeed.` → 3 sounds; @90s → 2/min good; @85s → 2.1/min high (boundary pair).
- B (19 words): `Um, we did it. Uh, then again um, and uh more happened during the launch window yesterday evening overall.` → 4 sounds @60s → 4/min high.
- NEG (18 words): `The summer project in Berlin went ahead and erred once, aha, but hmph the erlang service recovered quickly.` → 0 sounds ⇒ no Filler sounds row.
- R234 fixture (27 words, score 30 expected unchanged): `Um, I think we kind of did it. Kind of a summer project in Berlin, you know. I mean, at the end of the day it erred.`

## G0 Bundles
index-DLY8gzal.js / Builder-D26y3HFx.js live.

## G1 Mixed fixture M @90s — separation
Timer offset 90s. Pass: Quick fillers row exactly `Quick fillers to cut: “kind of” ×1, “i think” ×1, “you know” ×1 — 2/min. ` (no “um”, no “er”); separate row `Filler sounds: “um” ×2, “uh” ×1, “ah” ×1, “hmm” ×1 — 3.3/min — aim for no more than 1–2 per minute; pause instead of filling silence.` amber class. Screenshot.

## G2 Band math + boundary
A @90s → `Filler sounds: “um” ×1, “uh” ×1, “ah” ×1 — 2/min, within the 1–2 per minute guideline.` with emerald class (screenshot). Retime A @85s → `— 2.1/min — aim for…` amber. B @60s → `— 4/min — aim for…` amber. Screenshots for emerald and one amber.

## G3 Negatives + untimed
NEG (timed or not) → no "Filler sounds:" row (analysis card present). Reopen dialog (reset elapsed), fixture M untimed → `Filler sounds: “um” ×2, “uh” ×1, “ah” ×1, “hmm” ×1.` no "/min", amber. Screenshot.

## G4 Score invariance
R234 fixture: score 30/100 untimed and timed @90s (identical, same as R234 round).

## G5 Regression R233/R234
With M @90s: Pace row (round(25/1.5)=17 wpm slow amber) + Speaking time 75% emerald present; Quick fillers row semantics as G1.

## G6 375px + dark
375×812: both rows wrap, right ≤375, scrollWidth ≤375 (screenshot). Dark: emerald variant (A@90s) and amber variant contrast ≥4.5:1 core-pixel. Screenshots.

## G7 Cleanup
Zero /api/ai generation calls; reload clears Date.now stub; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. Screenshots r235_*.png; results appended below.

## Results (executed live on production, bundles index-DLY8gzal.js / Builder-D26y3HFx.js)
- G0 passed: exact bundles live (index-DLY8gzal.js, Builder-D26y3HFx.js)
- G1 passed: mixed fixture M @ Timed: 90s — Quick fillers row exactly `Quick fillers to cut: “kind of” ×1, “i think” ×1, “you know” ×1 — 2/min. ` (no um/er — sounds removed from the phrase row) and separate row exactly `Filler sounds: “um” ×2, “uh” ×1, “ah” ×1, “hmm” ×1 — 3.3/min — aim for no more than 1–2 per minute; pause instead of filling silence.` amber (r235_mixed_90s.png)
- G2 passed: A@90s → `— 2/min, within the 1–2 per minute guideline.` emerald class (r235_good_2min.png); A@85s boundary → `— 2.1/min — aim for…` amber (r235_boundary_21.png); B@60s → `— 4/min — aim for…` amber (r235_high_4min.png)
- G3 passed: NEG fixture (summer/Berlin/ahead/erred/aha/hmph/erlang, analysis card present) → no Filler sounds row (r235_negative.png); dialog reopen + M untimed → `Filler sounds: “um” ×2, “uh” ×1, “ah” ×1, “hmm” ×1.` amber, no "/min" (r235_untimed.png)
- G4 passed: R234 fixture score 30/100 untimed and timed @90s — identical to each other and to R234's recorded value (old FILLER_PHRASES scoring untouched)
- G5 regression passed: with M @90s, Pace "17 wpm" slow amber + Speaking time 75% emerald render alongside both filler rows
- G6 passed: 375×812 both rows right edge 337 ≤ 375, scrollWidth 375 (r235_375_rows.png); dark amber 10.33:1 (r235_dark_amber.png), dark emerald 9.18:1 (r235_dark_emerald.png), core-pixel + computed amber-400/emerald-400
- G7 done: zero /api/ai generation calls, Date.now stub cleared by reload, light theme, final localStorage exactly ["honestcv.clientId","honestcv.qa"]
