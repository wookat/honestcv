# QA plan — R259 skill-tailored bullet starters (production: cv.zalize.com)

Bundles: index-Ctbl6xVg.js / Builder-CJqElh2_.js (confirm both 200 / served first).

Code evidence: src/lib/bulletStarters.ts:112–190 `skillBulletStarters(role, skills)` —
one starter per skill cycling 3 role-family templates (engineer family: "Used <s> to
build [feature/service], improving [metric] by [add %]" / "Automated [process] with
<s>, saving [add #] hours per week" / "Led adoption of <s> across [team/project],
cutting [metric] by [add %]"), GENERIC_SKILL_TEMPLATES fallback. Builder.tsx:1210–1216
`starterSkills` = ats.missing high-priority-first (highKw), cap 6; :2668–2676 BulletIdeas
gets `role={e.role + ' ' + resume.targetRole}`, skills=starterSkills, onAdd appends the
starter to that entry's bullets. BulletIdeas :7650+ — toggle button "Need ideas? Show
bullet starters"; open panel shows tailored group first ("Tailored to your target job —
keywords the posting wants that your resume doesn't show yet:") with sky buttons
(bg-sky-50 dark:bg-sky-950/40), then existing role starters/action verbs.

## Checks

- G0 bundles live.
- G1 tsx oracle (.tmp-smoke relative import): engineer family cycling across 4+ skills
  (template index i%3), generic fallback role (e.g. "Chef"), verbatim multi-word skill
  ("product management") insertion — byte-exact expectations for the UI comparisons.
- G2 UI: seeded engineer resume + JD via visible #jd → open an experience entry's
  "Need ideas? Show bullet starters" → tailored group above role starters; button texts
  byte-match oracle skillBulletStarters(role, starterSkills-oracle); order =
  high-priority missing first then remaining; cap 6 when >6 missing.
- G3 click a tailored starter → appended as a new bullet in that entry (textarea/value
  contains the starter verbatim); after rescore the clicked keyword leaves ats.missing →
  its starter disappears from the reopened panel (live shrink), others remain.
- G4 ignoredKeywords: seeded resume.ignoredKeywords=[kw] → kw's starter absent, list
  re-caps from remaining missing.
- G5 no JD → no tailored group; panel = role starters + action verbs only (R139
  regression, byte-compare starter texts vs bulletStartersFor oracle).
- G6 375×812: panel open, scrollWidth===375.
- G7 rendered-pixel contrast of a tailored button (light bg-sky-50, dark
  dark:bg-sky-950/40) ≥4.5:1; screenshots + crops.
- G8 zero /api/ai/* completions; restore localStorage ["honestcv.clientId","honestcv.qa"]
  + light theme.

## Results (appended after production run, 2026-09-02)

Oracle: .tmp-smoke/r259_oracle.ts → /home/ubuntu/qa/r259_oracle.json
(`npx tsx --tsconfig tsconfig.app.json`). Runners: /home/ubuntu/qa/r259_run.py,
r259_run2.py. Fixture: Senior DevOps Engineer @ Initech (bullet "Maintained
python services in production"), targetRole Platform Engineer, JD with
nice-to-have (redis, kafka, graphql, "exposure") before a Requirements block
(kubernetes, terraform, grafana, ansible, prometheus, python) → 9 missing,
5 high-priority.

- G0 bundles index-Ctbl6xVg.js + Builder-CJqElh2_.js served (200 + resource
  entries) — PASS
- G1 oracle: engineer family cycles the 3 templates across 4 skills (i%3);
  generic fallback for "Chef"; multi-word "product management" inserted
  verbatim ("Applied product management to [what you did]…") — PASS
- G2 UI: heading "Tailored to your target job — keywords the posting wants that
  your resume doesn't show yet:"; 6 sky buttons byte-equal oracle
  skillBulletStarters; order = high-priority missing first (kubernetes,
  terraform, grafana, ansible, prometheus) then remaining (redis); cap 6 of 9
  missing (kafka/graphql/exposure dropped); tailored group above role starters;
  role starters byte-equal bulletStartersFor oracle — PASS
- G3 click first tailored starter → bullet appended verbatim to that entry
  (localStorage resume byte-check); after debounced rescore panel shrank live
  to the 6-item oracle for the new missing set (kubernetes gone, kafka slid in,
  templates re-cycled) — PASS
- G4 ignoredKeywords:["kubernetes"] → starter absent, list = oracle for the
  re-capped remaining missing — PASS
- G5 no JD → no tailored group/heading; role starters + 48 action-verb buttons
  intact (R139 regression) — PASS
- G6 375×812 panel open: scrollWidth === 375, 6 sky buttons rendered — PASS
- G7 rendered-pixel contrast of tailored button: light 10.63:1 (sky-50 bg),
  dark 11.36:1 (sky-950/40 bg) — PASS
- G8 __aiReqs [] at every stage (only baseline GET /api/ai/quota); final
  localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme — PASS

Screenshots: /home/ubuntu/screenshots/r259_g2_panel.png, r259_g3_shrink.png,
r259_g4_ignored.png, r259_g5_nojd.png, r259_375_panel.png,
r259_light_btn.png(+_crop), r259_dark_btn.png(+_crop), r259_cleanup_final.png.
No P0–P3 findings.
