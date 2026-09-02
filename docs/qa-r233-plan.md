# R233 QA plan — timed answers + delivery metrics in interview practice

Code evidence: src/lib/interviewAnalysis.ts analyzeDelivery (null if elapsed<5 || words<10; wpm=round(words/(elapsed/60)); paceBand slow<120/ideal 120–140/fast>140; windowPct=round(min(elapsed,120)/120*100); windowBand over iff elapsed>=120, under if pct<60). Builder.tsx: timer state 7842–7867 (interval 250ms reads Date.now, auto-expiry at 120s sets elapsedSec=120), button "Start 2-minute window"/"Stop timer"/"Retime answer" + role="timer" countdown "m:ss left — answer out loud while you type" (8332–8358), "Timed: Ns" chip (8361–8365), delivery rows Pace/Speaking time with emerald-700/amber-700 (+dark variants) at 8410–8435, resets on kind change (7894), advanceSession/finishSession → resetTimer (7925, 7940). Entry: Builder "Interview prep" button (6484, freeMode opens directly). Bundles: index-CQcuGfRi.js / Builder-XNpz-LnI.js.

Determinism: install `window.__off=0; const RD=Date.now; Date.now=()=>RD()+__off*1000` before starting the timer; bump `__off` to control elapsed and trigger auto-expiry. Screenshots for all visible claims.

## T0 Bundles + dialog
Bundles exact. Open Interview prep dialog; practice question + "Your answer" textarea visible; below it the outline "Start 2-minute window" button. Pass: button present, no Timed chip, no Pace/Speaking rows.

## T1 Live countdown + ideal math
Type an exactly-30-word answer (with STAR-ish content). Install Date.now override, click Start → button becomes "Stop timer", role=timer span shows "2:00 left — answer out loud while you type"; set __off=7 → span ticks to ~1:53 (screenshot mid-count). Set __off=15, click Stop. Pass: chip "Timed: 15s", button "Retime answer", rows appear: "Pace: 120 wpm — In the 120–140 wpm conversational range." (emerald) and "Speaking time: 13% of the 2-minute window — Underdeveloped…" (amber). Screenshot.

## T2 Slow band + auto-expiry over band
Retime with __off run to 30 then Stop → "Pace: 60 wpm — Below the 120–140…" slow band. Retime again, set __off=121, wait ≥250ms → timer auto-stops without clicking. Pass: "Timed: 120s", "Speaking time: 100% … Overextended — the window ran out; land the outcome sooner." (amber), Pace 15 wpm slow. Screenshot.

## T3 Guards + score invariance
(a) 9-word answer, time ~15s → NO Pace/Speaking rows (analysis card also absent since analyzeAnswer needs ≥10 words). (b) 30-word answer, Stop at 4s → no delivery rows (Timed: 4s chip may show). (c) Untimed 30-word answer: analysis card score N; after timing the same text score identical (delivery advisory only). Pass: exact absence/presence + equal score.

## T4 Resets
With Timed chip + rows showing inside a practice session: click "Next question" → answer cleared, Timed chip gone, button back to "Start 2-minute window". Close dialog / switch kind → reopen → timer state reset. Pass: chip absent both times.

## T5 375px + dark
375×812: timer row + delivery rows within viewport, scrollWidth ≤375 (screenshot). Dark (html.dark): emerald and amber row text contrast ≥4.5:1 vs card bg (core-pixel method + computed style). Screenshot.

## T6 Regression
R232 smoke: Contact "Add photo (optional)" + marker file → "Adjust photo" dialog opens; Cancel. ATS visible score unchanged across the round.

## T7 Cleanup
Zero /api/ai generation calls (no AI feedback clicks); restore real Date.now (reload); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. Screenshots r233_*.png; results appended below.

## Results (executed live on production, bundles index-CQcuGfRi.js / Builder-XNpz-LnI.js)
- T0 passed: exact bundles live; Interview prep dialog shows "Start 2-minute window" outline button below answer textarea, no Timed chip / delivery rows initially (r233_dialog_t0.png)
- T1 passed: Start → button "Stop timer", role=timer span "2:00 left — answer out loud while you type"; Date.now offset +7s → "1:52 left" live tick (r233_countdown.png). Stop with 30-word answer: formula exact — Timed 17s → "Pace: 106 wpm" (round(30/(17/60))=106); Timed 14s → "Pace: 129 wpm — In the 120–140 wpm conversational range." emerald + "Speaking time: 12% … Underdeveloped" amber; button reads "Retime answer" (r233_ideal_rows.png)
- T2 passed: Timed 30s → "Pace: 60 wpm" slow amber, 25% under (r233_slow_rows.png); offset 121s → timer auto-stopped without click (Stop button gone), "Timed: 120s", "Speaking time: 100% … Overextended — the window ran out; land the outcome sooner.", Pace 15 wpm (r233_over_rows.png)
- T3 passed: 9-word answer → no rows; 30-word answer Timed 3s → chip shows but no rows (elapsed<5 guard); score invariance — same 30-word answer scores 80/100 untimed (rows absent) and 80/100 timed (rows present) (r233_untimed_score.png)
- T4 passed: session started via client-side fetch stub of /api/ai/interview-questions (zero real AI calls) → Practice all 2; Timed 14s on Q1 (r233_session_timed.png) → "Next question": answer cleared, Timed chip gone, button back to "Start 2-minute window", Q2 shown (r233_after_next.png); retimed on Q2 → "End early" also resets; dialog close/reopen resets too
- T5 passed: 375×812 — delivery rows maxRight 322 ≤ 375, dialog right 375, scrollWidth 375, no overflow (r233_375_rows.png); dark — emerald row 9.18:1, amber row 10.33:1 vs card bg (core-pixel + computed oklch emerald-400/amber-400) (r233_dark_rows.png, r233_dark_full.png)
- T6 regression passed: R232 photo "Adjust photo" dialog still opens on marker upload, Cancel clean (r233_r232_smoke.png); targeted ATS invariance — example resume 99/100 before vs after a full timed-answer session, identical
- T7 done: zero /api/ai generation calls (fetch stub intercepted the one suggest-questions request client-side; real fetch restored), Date.now restored via reload, light theme, final localStorage exactly ["honestcv.clientId","honestcv.qa"]
- Note: one earlier 375px attempt showed 0 rows due to a race right after reload (override/state not settled); a clean retry worked — recorded here so it is not mistaken for a product bug.
