# R225 QA plan — session-scoped "Fixed" chips on ATS checks (index-BaUB_IpD.js)

Code evidence: Builder.tsx ~6358 — chip `<span class="… bg-emerald-100 … text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Fixed</span>` rendered after label when `c.pass && fixedChecks.has(label)`; fixedChecks effect: first render (prev null) marks nothing; fail→pass adds, pass→fail removes; state-only → reload clears. AtsChecker.tsx — chip text "Fixed since last check", recomputed per scan from prev scan map; first scan marks nothing.

## U1 Bundles + baselines unchanged
index-BaUB_IpD.js / ats-eZUrBMJ_.js / AtsChecker-CofUhLUY.js / Builder-DleUE6Qd.js exact. Fresh sample: Builder groups 12+5+7=24, Structure 92, 2 pre-existing Best-practices fails, ZERO "Fixed" chips anywhere.

## U2 Builder chip lifecycle (LinkedIn URL check)
1. Delete LinkedIn from contact via UI → "LinkedIn URL" row ✗ under BEST PRACTICES, no chip. 
2. Restore LinkedIn → row ✓ WITH emerald "Fixed" chip; all other rows chip-free (count chips == 1).
3. Regress (delete again) → row ✗, chip count 0. Re-fix → chip back (count 1).
4. Reload page → row ✓ but chip count 0 (no persistence).
Structure returns to 92 after fix (score unchanged by chips).

## U3 Checker chip lifecycle
1. Paste weak-opener fixture (R223) → scan 1: score 86, 11+4+7=22 rows, zero chips.
2. Edit paste to fix the weak opener (replace "- Worked on various tasks." with strong quantified bullet), rescan → "Strong bullet openers" AND "No filler words" rows ✓ each with "Fixed since last check" chip; always-passing rows unmarked (chip count == 2); score 95 = round(21/22·100).
3. Regress: restore the bad bullet, rescan → chips gone (count 0), score 86 again.

## U4 375px
With a chip visible, scrollWidth==375 on /builder breakdown and /ats-checker.

## U5 Dark mode
html.dark guard; chip computed style = emerald-950 bg / emerald-300 text; contrast ≥4.5:1 (compute).

## U6 Cleanup
Zero /api/ai generation calls (quota allowed); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production)
- U1 PASS: index-BaUB_IpD.js / ats-eZUrBMJ_.js / AtsChecker-CofUhLUY.js / Builder-DleUE6Qd.js live. Fresh sample after reload: 0 chips, groups 12+5+7=24, Structure 92 (same 2 Best-practices fails). Note: clicking "Load an example resume" onto an empty resume itself produces 8 "Fixed" chips (empty→sample is a legit fail→pass transition mid-session); a reload clears them — behavior matches the implementation, disclosed as UX nuance.
- U2 PASS: delete LinkedIn via UI → row ✗ no chip; retype → row ✓ with exactly one "Fixed" chip (LinkedIn URL only); regress → chip removed; re-fix → chip back; reload → chip gone; Structure back to 92 throughout (chips don't affect score).
- U3 PASS: checker scan1 (weak-opener fixture) 86, 22 rows, 0 chips; fixed paste rescan → 95 with exactly 2 "Fixed since last check" chips (Strong bullet openers, No filler words), no chips on always-passing rows; regressed rescan → 86, 0 chips.
- U4 PASS: scrollWidth 375 with chips visible on both /ats-checker and /builder.
- U5 **FAIL (P2)**: dark-mode chip contrast is **2.32:1** (<4.5:1). Rendered text ≈ rgb(23,106,78) on bg rgb(0,44,34) (pixel-verified at 6x zoom). Root cause: the site's `.dark` theme block redefines the emerald palette inverted (`--color-emerald-300: oklch(47% .09 165)`, `--color-emerald-800: oklch(86% .1 161)`), so `dark:text-emerald-300` resolves to a *dark* green on the emerald-950 bg. `dark:bg-emerald-950` is unaffected (not redefined). Light mode is fine: emerald-800 on emerald-100 ≈ 6.9:1. Suggested fix: use `dark:text-emerald-800` (light under this inverted theme) or reference a raw oklch/emerald token not remapped by `.dark`.
- U6 PASS: only /api/ai/quota + /api/billing/status; zero generation calls; light theme restored; localStorage exactly ["honestcv.clientId","honestcv.qa"].
Screenshots: r225_builder_fixed_chip / r225_checker_fixed_chips / r225_375_builder_chip / r225_375_checker_chip / r225_dark_chip / r225_chip_zoom (in /home/ubuntu/screenshots/).
