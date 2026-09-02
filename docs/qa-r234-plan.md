# R234 QA plan — quick-filler frequency/placement/rate row

Code evidence: src/lib/interviewAnalysis.ts analyzeQuickFillers (68–109): 16 word-boundary phrases incl. um/uhm/uh/er; atStart when index 0 or preceded by [.!?]\s+; perMinute=round(total/(elapsed/60)*10)/10 only when elapsed≥5 and total>0 else null. Builder.tsx 7885–7888 quickFillers gated on kind='interview' + analysis (≥10 words); row render 8447–8464: amber p, format `Quick fillers to cut: “phrase” ×N (M at sentence start), … — R/min. ` + weHeavy note appended in same p. analyzeAnswer/FILLER_PHRASES untouched (120–131, scoring 187–197). Bundles: index-EfGPBQS_.js / Builder-BDBCmDr-.js.

Fixture answer A (27 words): `Um, I think we kind of did it. Kind of a summer project in Berlin, you know. I mean, at the end of the day it erred.`
Locally computed expectation (node, exact library code): hits in phrase-list order — kind of ×2 (1 at sentence start), i think ×1, i mean ×1 (1 at sentence start), you know ×1, at the end of the day ×1, um ×1 (1 at sentence start); total 7; at 90s → 4.7/min. Negatives inside A: summer/Berlin/erred must not add hits (um⊄summer, er⊄erred/Berlin).
Expected score for A (no JD): lengthPts round(27/40·15)=10? words=27 → round(10.125)=10; star c/a/r all false; old fillers distinct {kind of,i think,you know}=3→4pts; weHeavy false→+7 ⇒ round((10+0+11)/70·100)=30. (Exact value asserted at runtime timed vs untimed equality is the primary check; absolute value recorded.)
Negative answer B (0 hits, ≥10 words): `Our summer project in Berlin erred once but the erlang service recovered quickly after we deployed the fix together yesterday.` — verified locally: hits [], total 0 ⇒ no "Quick fillers" row.

## F0 Bundles
index-EfGPBQS_.js / Builder-BDBCmDr-.js live. Fail otherwise.

## F1 Timed row exact
Interview dialog; answer A; Date.now offset trick: start timer, __off=90, stop. Pass: amber row text exactly `Quick fillers to cut: “kind of” ×2 (1 at sentence start), “i think” ×1, “i mean” ×1 (1 at sentence start), “you know” ×1, “at the end of the day” ×1, “um” ×1 (1 at sentence start) — 4.7/min. ` (modulo trailing space). Timed chip "Timed: 90s" (±1s tolerance → if 91s, expected rate recomputed = 4.6; assert against actual elapsed). Screenshot.

## F2 Negatives
Answer B → no "Quick fillers" row (analysis card present, since ≥10 words). Screenshot.

## F3 Untimed no rate
Close/reopen dialog (resets elapsed); answer A untimed → row with same counts but NO "/min" substring. Pass: row text has counts, `!/\/min/`.

## F4 Score invariance
Score shown for A untimed == score with elapsed 90s (rows visible) — identical value (expected 30/100 per R233-unchanged scoring). Fail if differs.

## F5 R233 regression
With A timed at 90s: Pace row = round(27/1.5)=18 wpm slow + Speaking time 75% ideal band emerald — both present.

## F6 375px + dark
375×812: quick-filler row wraps, right edge ≤375, scrollWidth ≤375 (screenshot). Dark: amber row contrast ≥4.5:1 core-pixel. Screenshot.

## F7 Cleanup
Zero /api/ai generation calls; restore Date.now (reload); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. Screenshots r234_*.png; results appended below.

## Results (executed live on production, bundles index-EfGPBQS_.js / Builder-BDBCmDr-.js)
- F0 passed: exact bundles live (index-EfGPBQS_.js loaded, Builder-BDBCmDr-.js fetched on route)
- F1 passed: fixture answer A timed via Date.now offset, "Timed: 90s" exact; amber row text exactly `Quick fillers to cut: “kind of” ×2 (1 at sentence start), “i think” ×1, “i mean” ×1 (1 at sentence start), “you know” ×1, “at the end of the day” ×1, “um” ×1 (1 at sentence start) — 4.7/min. ` — byte-for-byte the locally precomputed expectation, total 7 at 90s → 4.7/min (r234_timed_row.png)
- F2 passed: negative answer B (summer/Berlin/erred/erlang, ≥10 words) → analysis card present but NO "Quick fillers" row; adversarial substrings did not trigger um/er word-boundary matches (r234_negative.png)
- F3 passed: dialog close/reopen reset elapsed; same answer A untimed → identical counts/placement row ending `…(1 at sentence start). ` with no "/min" substring (r234_untimed_row.png)
- F4 passed: score 30/100 identical timed (rows visible) and untimed — matches plan-computed R233-unchanged scoring (lengthPts 10 + old-fillers 4 + notWeHeavy 7 over 70)
- F5 regression passed: with A at 90s, "Pace: 18 wpm — Below the 120–140…" amber + "Speaking time: 75% … Appropriately complete" emerald both render
- F6 passed: 375×812 row wraps to 4 lines, right edge 337 ≤ 375, scrollWidth 375 (r234_375_row.png); dark amber-400 contrast 10.33:1 core-pixel (r234_dark_row.png)
- F7 done: zero /api/ai generation calls, Date.now restored via reload, light theme, final localStorage exactly ["honestcv.clientId","honestcv.qa"]
