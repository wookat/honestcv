# QA — R285 target-job-tailored suggest bullets (prod cv.zalize.com, expect index-BLm2S5fA.js / Builder-Bi7tjjaB.js)

Code-traced: Builder.tsx:1421–1422 — runSuggestBullet now sends
`targetRole: resume.targetRole.trim() || undefined` and
`jobDescription: resume.jobDescription.trim() || undefined` in POST /api/ai/suggest-bullet;
JSON.stringify drops undefined, so with blank target job the payload keys must be byte-identical
to R284. Target role input id="targetRole" (2143–2149); JD textarea bound to resume.jobDescription
(2187). Harness: /home/ubuntu/qa/r283_lib.py buffered Fetch interception on `*api/ai/suggest-bullet*`,
Fetch.failRequest every request pre-network. Zero live AI.

## T1 Payloads with target job set
Seed fixture: exp (role "Senior Dev"/company "Acme", 1 bullet), project ("Widget Tool"/org "Acme
Labs", 2-line description), involvement ("Volunteer Lead"/"Code Club"), plus
targetRole:"Senior Engineer" and jobDescription:"We need an engineer who ships data pipelines and
cuts costs." (seed via honestcv.resume; verify the Target job panel shows both values in the UI —
screenshot). Click all six suggest buttons (exp/proj/inv × plain/…with key numbers), intercept+abort
each. Assert each body has targetRole:"Senior Engineer" AND jobDescription equal to the seeded JD
string; proj bodies keep section:"project", inv section:"involvement", exp NO section; key-numbers
bodies have variant:"key-numbers", plain bodies none.
## T2 Cleared target job → baseline keys
Clear Target role input and JD textarea via the UI (set to ''), click exp plain suggest + proj
plain suggest: intercepted body key sets exactly [bullets,company,resumeText,role] (exp; companyInfo/
language absent when empty) and [bullets,company,resumeText,role,section] (proj) — NO targetRole,
NO jobDescription keys.
## T3 Regression (R284b) disabled tooltips
Blank project name+org → both project suggest buttons disabled, title exactly "Add a project name
or organization first — the bullet is drafted for that project."
## Safety/cleanup
Every suggest request failRequest'd pre-network; localStorage exactly
["honestcv.clientId","honestcv.qa"]; empty html class; screenshots /home/ubuntu/screenshots/r285_*.png.
