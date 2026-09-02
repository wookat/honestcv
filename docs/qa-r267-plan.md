# QA plan — R267 Jobs "Locations:" facet chips (production: cv.zalize.com)

Bundles: index-CG7n1xJN.js / Jobs-zdED-RJ2.js.

Code evidence: src/lib/jobs.ts:104–130 `isLocationAgnostic` ('' | 'remote' | /\b(worldwide|anywhere|global)\b/)
and `locationFacets(locations, cap=8)` (trim, skip agnostic, case-insensitive grouping keeping first-seen
casing, sort count desc then label alpha, cap 8). src/pages/Jobs.tsx:250–289 filter chain
base→afterExclude(Hide)→afterType→afterSkills; `locFacets = tab==='all' ? locationFacets(afterSkills.map(j=>j.location)) : []`
(line 289 — PRE-location-filter). :290–315 direct matches first then agnostic appended (R195). :636–660 row
`role=group aria-label="Filter by a location found in these results"`, span "Locations:", buttons
`{label} ({count})`, aria-pressed + ring when active, click toggles setLocationFilter(label|''), min-h-10
(sm:min-h-8). Data: /api/jobs/search?q=… (jobs.ts:152–162), location field `location`. Row hidden on
tracked/status tabs (tab!=='all' → locFacets=[]). Lead's oracle .tmp-smoke/r267_oracle.ts re-run: all green.

In-page recomputation: instrument fetch to capture the /api/jobs/search response JSON the page actually used,
then apply a JS port of locationFacets to the same list filtered by the CURRENT search/type/skills/Hide state
(for N1 use no extra filters so afterSkills === jobs).

## Checks (zero-AI; only /api/jobs/* + quota GET expected)

- N0 both bundles in /jobs resource entries; lead's oracle green (done in setup).
- N1 /jobs All tab, no filters: "Locations:" row present iff captured payload has non-agnostic locations;
  chip texts EXACTLY equal recomputed `label (count)` list (order, cap ≤8, no Remote/Worldwide/'' chips).
  Screenshot desktop light.
- N2 click first chip: location input value === label; aria-pressed=true + ring class on chip; result list =
  direct matches first then agnostic appended — assert DOM job-card locations: first block all contain label
  (case-insens substring), remainder all agnostic; count of shown cards === direct+agnostic recomputation.
  "Anywhere" divider index matches anywhereStart if rendered. Click chip again → input cleared,
  aria-pressed=false.
- N3 with active location chip, type a search/skills filter changing the result set → chips recompute from the
  new pre-location set and the row does NOT vanish; counts change vs N1 (assert recomputed equality again).
  Toggle a Hide chip if pipeline non-empty (seed one tracked job if needed — restore baseline after).
- N4 sorting properties on the live facet list: counts non-increasing; equal-count neighbors alphabetical;
  ≤8 chips. Case-insensitive grouping asserted via oracle (and live if payload contains a casing duplicate —
  else mark inconclusive-live/oracle-verified).
- N5 regression: Tracked tab (and a status tab) → no Locations row (role=group absent); R242 type filter and
  R243 skills chips still functional (quick check: applying them changes list + facets); R254 follow-up
  filter button still renders on Tracked when applicable.
- N6 375×812: scrollWidth === 375 with row visible; chip computed min-height ≥ 40px (min-h-10). Screenshot.
- N7 light + dark rendered-pixel contrast of inactive AND active chip text ≥4.5:1.
- N8 zero /api/ai/* completions; restore localStorage to exactly ["honestcv.clientId","honestcv.qa"], light
  theme (remove honestcv.jobPipeline and any seeded keys).

## Results (appended after production run)

Run on production, 18-job payload from /api/jobs/search?q= (default query), CDP + screenshots (recording down since R166).

- N0 passed — index-CG7n1xJN.js + Jobs-zdED-RJ2.js both in /jobs resource entries; lead's oracle .tmp-smoke/r267_oracle.ts re-run: all green (8/8).
- N1 passed — "Locations:" row present; 7 chips EXACTLY equal in-page recomputation of locationFacets over the captured payload: ["LATAM, Europe, USA, Canada, APAC (3)", "Americas, Europe, Israel (2)", "Europe (2)", "USA (2)", "Europe, EMEA, UK, Germany, France, European timezones (1)", "Europe, USA, UK, Canada, Australia, Singapore (1)", "USA, Canada, USA timezones (1)"]. No Remote/Worldwide/'' chips (payload had 8 Worldwide + 1 Remote job, all skipped). role=group + aria-label byte-exact. (r267_n1_row.png)
- N2 passed — click chip 0 → location input = "LATAM, Europe, USA, Canada, APAC", aria-pressed=true + ring-2 class; list = 3 direct Lemon.io matches first, then "Open to any location (6)" divider with 6 agnostic (Worldwide) jobs — exact match to recomputed direct(3)+anywhere(6). Second click → input '', aria-pressed=false. (r267_n2_active_chip.png)
- N3 passed — with "Europe (2)" chip active, type filter Full time → row persists, active chip persists, 5 chips exactly equal recomputation over full-time subset. Skills filter "python" → 3 chips exactly equal recomputation over python-matching subset (r267_n3c_skills.png). Hide "Applied (1)" exclusion → LATAM chip count 3→2 with correct alpha re-sort among count-2 ties (r267_n3d_hide.png). Search "engineer" recompute also byte-matched (result set happened identical to baseline — weak evidence, covered by type/skills/hide instead.)
- N4 passed — ≤8 chips, counts non-increasing, alpha order within count ties, zero agnostic labels. Case-insensitive grouping not observable in live data (no casing duplicates) — oracle-verified only.
- N5 passed — Tracked tab and Saved tab: row absent (also re-verified Tracked with a seeded pipeline entry). R254 "Needs follow-up (1)" button renders on Tracked with a 10-day-old applied entry. R242 type select and R243 skills input functional (used in N3). Note: one transient "row absent" read immediately after clicking back to All jobs; re-read a second later showed the full row — render-timing race in the probe, not a product issue.
- N6 passed — 375×812: scrollWidth === 375, chips wrap onto 6 rows, chip height 40px (min-h-10). (r267_n6_375.png)
- N7 passed — rendered-pixel contrast: light inactive/active 16.66:1, dark inactive/active 15.05:1 (≥4.5). (r267_n7_light.png / r267_n7_dark.png + chip crops)
- N8 passed — __aiReqs [] after chip toggles; only /api/ai/quota + /api/jobs/search in resource entries; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme restored.
