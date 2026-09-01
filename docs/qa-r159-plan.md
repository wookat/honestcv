# R159 QA plan — Score verdict on chip / strength card / breakdown dialog (bundles index-Byy4e1iI.js / Builder-D3_b4wDQ.js, PR #374)

Code evidence (diff R158..R159, Builder.tsx only):
- SectionNav chip (~L627–643): aria-label `Resume health score {N} out of 100 — {verdict} — open full report`; chip text `{N}` + `<span class="hidden font-normal sm:inline">· {verdict}</span>` (hidden <sm), chip min-h-10 (40px) mobile.
- `scoreVerdict = s => s>=80?'Strong':s>=50?'Getting there':'Needs work'` (~L648).
- Resume strength card (~L1729): `{strength.score}% — {scoreVerdict(strength.score)}`.
- HealthDialog title (~L7842): `Score breakdown — ATS {ats}/100 · Writing {health}/100 ({verdict})`.

## E1 Bundles
Cache-busted fresh load; assert exactly index-Byy4e1iI.js + Builder-D3_b4wDQ.js. Baseline storage clean before seed.

## E2 Desktop 1600, high tier
Standard fixture (health ~99 = Strong). PASS iff sticky chip visibly shows "99 · Strong" in green band, aria-label contains "— Strong — open full report"; strength card shows "{S}% — {verdict-of-S}" matching S's own tier; Score breakdown dialog title ends "Writing 99/100 (Strong)". Screenshot each.

## E3 Tier sweep via content mutation
Edit honestcv.resume in localStorage (weaken bullets/remove sections) + reload to land health in 50–79 → PASS iff chip "N · Getting there" with amber band and dialog title "(Getting there)"; then gut resume to health <50 → chip "N · Needs work" red band, dialog "(Needs work)". Verdict word and color band must change together. FAIL if verdict static, mismatched with N, or band/verdict disagree. Strength card verdict must match its own strength score band at each state.

## E4 Dialog regression spot-check
In one dialog open: Fix→ link present, Guide links present, R157 entry chip present when applicable; content otherwise unchanged.

## E5 Mobile 375
Emulate 375. PASS iff chip shows number only (the "· verdict" span computed display:none / not visible in screenshot), chip height ≥40px, aria-label still contains verdict, scrollWidth ≤ 375. R152 chip tap still opens the report dialog.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; close emulated tab, fresh desktop tab innerWidth 1600; no AI/share/payment/export/delete.
