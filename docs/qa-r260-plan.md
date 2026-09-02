# QA plan — R260 proven-skills chips in Builder Skills section (production: cv.zalize.com)

Bundles: index-1KIs4Uxd.js / Builder-DOVd_ZHu.js.

Code evidence: src/lib/bulletStarters.ts:311–343 (`skillLexicon()` union of
SKILL_GROUPS deduped case-insensitively in group order; `skillPattern` —
single word `(?:^|[^a-z0-9])skill(?=$|[^a-z0-9])` /i, phrase → substring /i;
`provenSkills(body, skills)` = lexicon ∩ body ∖ skills, same pattern both sides).
Builder.tsx:1223–1226 `proven = provenSkills(resumeToPlainText(shown), shown.skills)
.slice(0,10)` (shown = visibleResume); :5213–5235 emerald chips row (label
"Mentioned in your experience but not listed in Skills — recruiters scan this
section first:", `bg-emerald-50 dark:bg-emerald-950/40` rounded-full buttons,
comma-append to resume.skills) rendered ABOVE the existing role-family chips row.

## Checks

- G0 bundles served 200 + present in Builder resource entries.
- G1 tsx oracle (.tmp-smoke relative imports, npx tsx --tsconfig tsconfig.app.json):
  - word boundary: body "We optimized MySQL indexes" → provenSkills does NOT
    include "SQL"; body "Wrote SQL queries" → includes "SQL".
  - phrase substring: body containing "…machine learning…" → phrase lexicon skill
    matched (e.g. "User research" via substring test with its own fixture).
  - skills-side exclusion incl. category-line format: skillsText "Technical:
    React, SQL" excludes both React and SQL.
  - lexicon dedup: each of SQL/Jira/Excel/CRM/User research appears exactly once
    in skillLexicon(); no case-insensitive dupes at all.
  - Builder semantics cap: fixture with >10 body matches → slice(0,10).
- G2 UI: seeded engineer resume (targetRole Platform Engineer) with bullets
  mentioning cross-family skills (Tableau, Salesforce, Docker, …) absent from
  Skills → emerald row visible ABOVE role-family chips row; chip texts byte-match
  oracle order (lexicon group order) and canonical casing.
- G3 click one emerald chip → resume.skills comma-appends the skill; chip
  disappears live from the emerald row (and any duplicate in the role chips row
  behavior per existing code — role chips row is independent, only assert emerald).
- G4 exclusions: skills "Tools: Tableau" → Tableau chip absent; resume whose body
  has no lexicon matches → no emerald row/label, role-family chips row unchanged
  (R164 regression, byte-compare role chip texts vs skillSuggestionsFor oracle).
- G5 375×812: Skills section with emerald row, scrollWidth===375; rendered-pixel
  contrast of an emerald chip light+dark ≥4.5:1.
- G6 zero /api/ai/* completions (baseline GET /api/ai/quota allowed); cleanup to
  ["honestcv.clientId","honestcv.qa"] + light theme; remove .tmp-smoke oracle
  files afterwards (they break npm run lint).

## Results (appended after production run, 2026-09-02)

Oracle: .tmp-smoke/r260_oracle.ts (removed after run — lint) →
/home/ubuntu/qa/r260_oracle.json. Runners: /home/ubuntu/qa/r260_run.py,
r260_run2.py. Main fixture: Senior DevOps Engineer @ Initech, targetRole
Platform Engineer, skills "Terraform", 4 bullets mentioning 13 lexicon skills
(Tableau, Excel, Salesforce, CRM, Docker, Kubernetes, Jira, Asana, SQL, Python,
AWS, Git, CI/CD).

- G0 bundles index-1KIs4Uxd.js + Builder-DOVd_ZHu.js served — PASS
- G1 oracle: "MySQL" does NOT match "SQL" (boundary), "Wrote SQL queries" does;
  phrase skill ("REST APIs") matched case-insensitively as substring; skills-side
  exclusion incl. category line "Technical: React, SQL" → both excluded;
  skillLexicon() has zero case-insensitive dupes (SQL/Jira/Excel/CRM once each);
  raw 13 matches → slice(0,10) — PASS
- G2 UI: label "Mentioned in your experience but not listed in Skills —
  recruiters scan this section first:"; 10 emerald chips byte-equal oracle
  ['Python','SQL','Docker','Kubernetes','AWS','CI/CD','Git','Salesforce','CRM',
  'Jira'] (lexicon group order, canonical casing, cap 10 of 13); row rendered
  ABOVE the "Common for your target role" chips row (DOM position check); role
  chips byte-equal skillSuggestionsFor oracle — PASS
- G3 click "+ Python" → resume.skills === "Terraform, Python" (comma-append,
  localStorage byte-check); emerald row updated live to the 10-item oracle for
  the new skills (Python gone, Tableau slid in past the cap) — PASS
- G4 small fixture (body: Tableau+Docker): skills "Tools: Tableau" → chips
  ['+ Docker'] only (category-line exclusion); control with empty skills →
  ['+ Docker','+ Tableau']; no-lexicon-match body → no emerald row/label and
  role-family chips row unchanged (R164 regression) — PASS
- G5 375×812: 10 chips rendered, scrollWidth === 375; emerald chip
  rendered-pixel contrast light 13.01:1 (emerald-50 bg), dark 12.51:1
  (emerald-950/40 bg) — PASS
- G6 __aiReqs [] throughout (only baseline GET /api/ai/quota); final
  localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme;
  .tmp-smoke oracle files removed (r258/r259/r260) — PASS

Screenshots: /home/ubuntu/screenshots/r260_g2_row.png, r260_g3_clicked.png,
r260_g4_cat.png, r260_g4_norow.png, r260_375_row.png, r260_light_chip.png(+_crop),
r260_dark_chip.png(+_crop), r260_cleanup_final.png. No P0–P3 findings.
