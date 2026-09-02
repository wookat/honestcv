# QA — R281b unfinished-link scan covers headline fields (prod cv.zalize.com, expect index-qxSweOGA.js / guidance-CpJT1DaZ.js)

Code-traced: guidance.ts:318 now `unfinishedLinks(resumeToPlainText(r))` (full resume text incl.
role/company/headline inputs); bracket-placeholder scan (l.323–330) still summary+bullets only.
Harness: CDP :29229, seed fixture on prod origin, real Ctrl+K keystrokes, breakdown dialog text
assertions + screenshots; zero non-quota AI; restore ["honestcv.clientId","honestcv.qa"] + theme.

## N1 role link → new finding, no bracket false positive
Fixture role `Senior Engineer`; select `Senior` in role input, Ctrl+K → value exactly
`[Senior](url) Engineer` with `url` selected. Open Score breakdown → Consistency shows
`1 link like [Senior](url) still points at a placeholder — replace "url" with a real web address`
(pre-fix showed "Tenses and placeholders look clean"). NO "bracket placeholder" finding.
## N2 regression: bullet link counted once
With role link removed and bullet `Shipped [quickly](url) improvements.` → exactly
`1 link like [quickly](url)…` (not "2 links").
## N3 valid role link clears finding
Set role to `[Senior](example.com/x) Engineer` → breakdown shows "Tenses and placeholders look
clean" (no link finding).
## N4 preview renders role link
Preview role heading contains an `<a>` for `Senior` (href normalized https://example.com/x), no
literal `[`/`](`.
## Safety/cleanup
`window.__aiReqs` non-quota empty; localStorage exactly baseline; empty html class. Screenshots
/home/ubuntu/screenshots/r281b_*.png.
