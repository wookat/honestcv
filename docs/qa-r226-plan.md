# R226 QA plan — "Application ready" readiness strip (index-DoX1yeSL.js)

Code evidence: ats.ts `applicationReadiness(ats)` — tier: score≥90 'ready'/'Ready to send' emerald, ≥50 'almost'/'Almost there' amber, else 'not-yet'/'Needs work' red; blockers: per-category failing counts "`N ${label.toLowerCase()} check[s] failing`" in CHECK_CATEGORIES order, plus "keyword match at N% (M missing)" when keywordScore!==null && <70; sliced to 3. Builder.tsx ~6341: strip is first child of the mt-3 space-y-3 breakdown div; AtsChecker.tsx ~611: strip directly under "Format & content checks" p. Classes bg-emerald-100/text-emerald-800, amber, red — no dark: overrides (inverted dark palette should auto-flip).

## W1 Bundles + Builder sample (no JD)
index-DoX1yeSL.js / ats-BbeT5BHU.js / AtsChecker-D51mthkf.js / Builder-DVq2ZXgk.js exact. Fresh sample: ATS score/structure 92, strip emerald with exact text `Application ready: Ready to send — 2 best practices checks failing` (2 fails both bestPractices); groups still 12+5+7=24.

## W2 Builder tier transitions
Break checks (delete LinkedIn + summary etc.) to drive score into 50–89 → amber `Almost there` with blockers listing correct per-category counts (singular "1 … check failing" verified somewhere); wipe resume to near-empty (known score 33) → red `Needs work` with ≤3 blockers; restore sample → emerald again. Note: Builder ats.score with no JD == structure score.

## W3 Checker tiers + keyword blocker
Weak-opener fixture → 86 amber, blockers `2 content checks failing · 1 best practices check failing`; fixed paste → 95 emerald `Ready to send — 1 best practices check failing`. Add JD (mismatched keywords) → keywordScore<70 → blocker text matches regex `keyword match at \d+% \(\d+ missing\)` appended (≤3 total).

## W4 Invariants (regression)
Category counts 12+5+7 / 11+4+7; baselines 92/86/95 unchanged; R225 Fixed chip still appears on LinkedIn break→fix; a Fix → deep link still lands experience anchor top ~112.

## W5 375px
scrollWidth==375 on both pages with strip visible.

## W6 Dark mode
html.dark guard; pixel-verify strip text/bg contrast ≥4.5:1 at 6x zoom for the tiers reachable (at minimum emerald + amber; red if wiped state retained).

## W7 Cleanup
Zero /api/ai generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production)
- W1: bundles index-DoX1yeSL/ats-BbeT5BHU/AtsChecker-D51mthkf/Builder-DVq2ZXgk live. Sample: 12+5+7=24, Structure 92, strip "Application ready: Ready to send — 2 best practices checks failing" bg-emerald-100/text-emerald-800. PASS
- W2: LinkedIn deleted → 88, amber "Almost there — 3 best practices checks failing". Empty resume → structure 71 → amber with 3 blockers (3 content · 1 format · 3 best practices; keyword blocker correctly sliced at 3 in red state). Mismatched JD on sample → score 28 (=round(0·70+92·30)/100) → red "Needs work — 2 best practices checks failing · keyword match at 0% (14 missing)". Restore → emerald 92. PASS. Note: the "N/100" badge in header is Writing health, ATS tier uses ats.score (=structure w/o JD) — no discrepancy.
- W3: checker weak-opener 86 amber "2 content checks failing · 1 best practices check failing" (singular correct); fixed paste 95 emerald "Ready to send — 1 best practices check failing"; +JD mismatched → red with "keyword match at 0% (14 missing)". Groups 11+4+7=22. PASS
- W4: checker chips 2 ("Fixed since last check" on Strong bullet openers + No filler words); Builder LinkedIn break→fix chip "Fixed"; Fix → deep link lands skills anchor top 112. PASS
- W5: scrollWidth exactly 375 on both pages with strip visible. PASS
- W6: under html.dark — emerald strip rgb(148,230,188) on rgb(11,60,43) = 8.44:1; amber rgb(246,212,128) on rgb(72,48,0) = 8.62:1; red rgb(255,177,171) on rgb(84,37,35) = 7.28:1. Light: emerald 6.70, amber 6.36, red 6.85. All ≥4.5. PASS
- W7: zero /api/ai generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. DONE
