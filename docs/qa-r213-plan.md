# R213 QA plan — Locations on each entry check (index-BjJeJlqR.js)

Code evidence: src/lib/ats.ts — entryLocationsCheck: label 'Locations on each entry'; fail hint `"<name>" has no location — add a city (or "Remote") to every entry so employers can validate your experience.`; pass hint 'Every entry lists a location — employers can validate your experience at a glance.'; anchor = offender's ('education' for education offenders else 'experience'). Builder entries: experience (!hidden, role||company, e.location, name "role at company"), involvement (!hidden, role||organization), education (!hidden, school nonblank, anchor 'education'). Checker textEntryLocations: experience block segments from date-range's line start to next range; LOCATION_LIKE_RE `/\b(?:Remote|Hybrid)\b|\b[A-Z][A-Za-z.]+,\s*(?:[A-Z]{2}\b|[A-Z][A-Za-z]+)/`; no heading or no ranges → [] → pass. Denominators: checker 14, Builder 15.

## G1 Bundles
index-BjJeJlqR.js / ats-E3_bcKPT.js / AtsChecker-Ci2MUCsQ.js / Builder-vwUTrn5n.js exact.

## G2 Builder pass + 15 rows
Example resume → "✓Locations on each entry"; breakdown 15 rows.

## G3 Builder fail states + anchors
(a) experience[0].location='' → fail hint exactly `"Software Engineer at Brightlane" has no location — add a city (or "Remote") to every entry so employers can validate your experience.`; Fix → lands on experience anchor. (b) Restore; education[0].location='' → fail naming the school; deep link (via checker not applicable — assert Builder row Fix → scrolls to [data-section-anchor="education"]).

## G4 Hidden entry ignored
experience[0].location='' + hidden=true → passes.

## G5 Checker matrix (14 rows)
(a) Entries with "Austin, TX" / "Remote" on role lines → pass. (b) Second entry with no location-like text → FAIL quoting its date range. (c) No Experience heading → pass (guard). (d) Rows count == 14. (e) Priority fix "Locations on each entry … Fix in builder →" → /builder, [data-section-anchor="experience"] in view. (f) Arithmetic: no-JD score == round(passes/14·100); failing fix +7.1 = 100/14.

## G6 375 + dark
Failing row at 375 (scrollWidth==375); dark pixel contrast ≥4.5:1.

## G7 Regression (smoke)
R212 LinkedIn fail on missing URL, R211 pronoun fail, R203 pts sorted desc — combined fixture.

## G8 Cleanup
Zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production)
- G1 bundles exact: index-BjJeJlqR.js / ats-E3_bcKPT.js / AtsChecker-Ci2MUCsQ.js / Builder-vwUTrn5n.js — PASS
- G2 example resume: "✓Locations on each entry"; Builder breakdown 15 rows — PASS
- G3a experience[0].location='' → fail, exact hint `"Software Engineer at Brightlane" has no location — add a city (or "Remote") to every entry so employers can validate your experience.`; row Fix → lands [data-section-anchor="experience"] top 112 — PASS
- G3b education[0].location='' → fail naming "University of Texas at Austin"; row Fix → lands [data-section-anchor="education"] top 112 — PASS
- G4 hidden blank-location entry ignored → pass state — PASS
- G5a entries with "Austin, TX"/"Remote" on the date lines → pass — PASS
- G5b second entry with no location text → fail quoting "2019 - 2021" — PASS
- G5c no Experience heading → pass (guard) — PASS
- G5d checker 14 rows; no-JD 79/100 = round(11/14·100); fixes +7.1 = 100/14 — PASS (digit-exact)
- G5e fix row "Locations on each entry … Fix in builder →" → /builder, experience anchor top 112 — PASS
- G6 375px scrollWidth 375; dark label pixel contrast 14.75:1 — PASS
- G7 regression: R212 LinkedIn fails on missing URL; R211 pronoun fails (Found "I") while Locations passes independently; R203 pts [20,12,7.1,7.1,7.1] sorted desc — PASS
- G8 zero /api/ai/* requests; light theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE

### Finding (P3, by-design limitation worth noting)
Checker segments run from the DATE-RANGE's line start to the next range. A location written on the role/company line ABOVE the date line (very common layout "Company — Austin, TX" then dates below) is attributed to the PREVIOUS entry's segment, so the last entry fails ("…has no location") even though every entry visibly lists one. Verified live: fixture with "Senior Engineer, Acme — Austin, TX" / "Software Engineer, Beta Corp — Remote" above their date lines fails quoting "2019 - 2021". Locations on/after the date line work as specced.

## Fix2 addendum — P3 segmentation fix (index-BdQhdXJh.js)
Code: textEntryLocations now uses headerStart(): segment starts up to 2 lines above the date range (floored at previous range's end), next segment starts at its own header lines.
- H1 Bundles exact: index-BdQhdXJh.js / ats-CutuZIOG.js / AtsChecker-CWjQAmIf.js / Builder-mkK7BT2z.js.
- H2 Prior P3 repro (locations "— Austin, TX"/"— Remote" on role lines ABOVE dates) now PASSES.
- H3 Location-less second entry still FAILS quoting "2019 - 2021"; date-line-location fixture still passes; no-heading guard passes.
- H4 Smoke: Builder sample 15 rows, Locations passes; checker 14 rows.

### Fix2 results (production)
- H1 bundles exact: index-BdQhdXJh.js / ats-CutuZIOG.js / AtsChecker-CWjQAmIf.js / Builder-mkK7BT2z.js — PASS
- H2 prior P3 repro (locations "— Austin, TX"/"— Remote" on role lines above dates) now PASSES — FIX VERIFIED
- H3a location-less entry still fails quoting "2019 - 2021" — PASS, with caveat: only when the header has no "Word, Word" comma; "Software Engineer, Beta Corp" itself matches LOCATION_LIKE_RE ("Engineer, Beta") so comma-style headers false-PASS the check (new P4 disclosure — the header widening pulled headers into scope of the regex)
- H3b date-line locations still pass; H3c no-heading guard passes — PASS
- H4 Builder sample 15 rows with ✓Locations; checker 14 rows — PASS
- Disclosure: one GET /api/ai/quota observed on Builder load (quota read, not a generation call); zero generation /api/ai/* requests. localStorage baseline restored.
