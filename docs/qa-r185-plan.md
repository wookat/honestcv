# R185 QA plan — best-match entry preselect in KeywordBulletDialog (index-CVv-AocX.js / Builder-Cotw9MBS.js)

Code evidence: src/lib/ats.ts bestExperienceForKeyword (kw token +3, other JD kw +1, ties keep order, hidden entries filtered out by caller); Builder.tsx KeywordBulletDialog computes bestId at mount from non-hidden entries, select `#kwBulletExp` preselects bestId, option label appends " — best match", hint `Preselected the role that best matches this keyword…` shown when bestId!==null && entries>1. Select only renders AFTER a draft exists (text !== null) — quota-saving method: CDP Fetch.fulfillRequest mock of POST /api/ai/keyword-bullet for structure-only checks; ONE real AI call reserved for the insert path.

## K1 Bundles
Serve index-CVv-AocX.js + Builder-Cotw9MBS.js.

## K2 Best-match preselect (1440, mocked draft)
3 experience entries; "kubernetes" only in entry 2's bullets; JD makes kubernetes a missing keyword. Open chip micro-button "Draft a bullet using kubernetes" → mock draft → select preselects entry 2, its option ends " — best match", hint line present.

## K3 Keyword in no entry (mocked)
Keyword absent everywhere → fallback = JD-context scoring / first entry; no crash; dialog renders.

## K4 Hidden entry excluded (mocked)
Hide entry 2 (the best match), reopen → preselect is NOT entry 2; hidden entry still selectable in dropdown.

## K5 Real AI insert (1 call)
Unhide; reopen; real "Draft the bullet"; change select to another entry; Add bullet → bullet lands in the chosen entry's textarea/resume.

## K6 Single entry + R154 triage path (mocked)
Single-entry resume → no hint line, no " — best match" needed (entries==1). R154 triage card "Yes — draft a bullet" opens the same dialog with preselect behavior.

## K7 Layout 1440 + 375
Dialog no horizontal overflow at 375; hint line fits.

## K8 Smoke (Regression)
R184 hover highlight, R183 save job → linked copy, R182 companyInfo input.

## K9 Cleanup
localStorage exactly ["honestcv.clientId","honestcv.qa"].
