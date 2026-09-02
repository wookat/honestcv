# QA plan — R263 recommended section order by experience level (production: cv.zalize.com)

Bundles: index-i5_4SGcZ.js / Builder-CD4Yog8_.js.

Code evidence: src/lib/resume.ts:713–720 `sectionEmphasisFor` (internship/entry →
'education-first'; other 6 tiers → 'experience-first'; ''/undefined → null);
:727–739 `recommendedSectionOrder` (pull block ['education','coursework'] or
['experience'] out of orderedSectionKeys, reinsert directly after 'summary';
null when no emphasis or already matching). Builder.tsx:5583–5620 "Section order"
panel (defaultOpen=false): sky hint box `border-sky-200 bg-sky-50 dark:bg-sky-950/40`,
span `text-sky-800 dark:text-sky-200` "Recommended for <label>: education near the
top." / "…experience right after the summary.", outline button "Apply recommended
order" → sets sectionOrder to recommended array.

## Checks

- J0 bundles 200 + present in resource entries.
- J1 fresh default resume + Entry level: open Section order panel → hint box with
  exact text "Recommended for Entry level: education near the top." + Apply button.
  Click Apply → orderedSectionKeys = summary, education, coursework, then all other
  keys in prior relative order (assert exact array vs computed expectation); hint
  box gone (order matches); rendered preview shows Education heading before
  Experience; persists through reload.
- J2 same resume (education-first order) switch level to Director → hint
  "Recommended for Director: experience right after the summary."; Apply →
  experience directly after summary, education/coursework keep relative order
  (exact array assert); hint gone.
- J3 Auto ('') with non-default order → no hint box. J3b default order + Mid →
  no hint (already experience-first).
- J4 Internship: hint text exactly "Recommended for Internship: education near the top."
- J5 custom section added before Apply → survives Apply and keeps relative position
  (exact array assert incl. `custom:<id>` key).
- J6 regression: arrow reorder still works after Apply; manually moving a section
  away from the recommendation makes the hint box reappear.
- J7 375×812 panel open with hint box: scrollWidth === 375.
- J8 hint span rendered-pixel contrast light + dark ≥4.5:1.
- J9 zero /api/ai/* completions; cleanup localStorage to exactly
  ["honestcv.clientId","honestcv.qa"], light theme.

## Results (appended after production run)

## Results (production run, bundles index-i5_4SGcZ.js / Builder-CD4Yog8_.js)

- J0 both bundles in resource entries — passed
- J1 Entry level on default order: hint exactly "Recommended for Entry level: education near the top." + Apply; after Apply list = [Summary, Education, Coursework, Experience, Projects, Involvement, Skills, Certifications, Awards & Honors, Publications, References, Military service, Agents] (exact array vs reinsert-after-summary expectation); hint gone; persists after reload; preview renders SUMMARY → EDUCATION (BSc · MIT) → EXPERIENCE (Engineer · Acme) in that order — passed
- J2 switch to Director on education-first order: hint exactly "Recommended for Director: experience right after the summary."; Apply → [Summary, Experience, Education, Coursework, …] exact; hint gone — passed
- J3 Auto ('') with non-default order → no hint; J3b default order + Mid → no hint (already experience-first) — passed
- J4 Internship hint exactly "Recommended for Internship: education near the top." — passed
- J5 custom section "Volunteering" present before Apply → survives Apply, stays last (relative order kept), exact 14-key array match — passed
- J6 regression: "Move down" arrow on Education still works after Apply ([Summary, Coursework, Education, …]) and moving away from the recommendation makes the hint reappear immediately — passed
- J7 375×812 panel open with hint box: scrollWidth === 375, hint within viewport — passed
- J8 hint span rendered-pixel contrast light 6.86:1 / dark 12.15:1 — passed
- J9 zero /api/ai/* completions (__aiReqs []); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme — passed

Note: preview headings render uppercase (SUMMARY/EDUCATION/EXPERIENCE) — probe must match uppercase. Screenshots: /home/ubuntu/screenshots/r263_*.png.
