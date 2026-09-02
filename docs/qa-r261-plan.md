# QA plan — R261 coursework multi-skills (production: cv.zalize.com)

Bundles: index-Dq8jDsMR.js / Builder-hrkCQFgs.js.

Code evidence: src/lib/resume.ts:2121–2135 — `courseworkSkills` = split(','),
trim, drop empties, slice(0,3); `courseworkBullets` = 0 skills → none,
1 → `Skill: X`, 2–3 → `Skills: A · B · C` (" · "), then description lines.
resumeToPlainText :2383–2388 and resumeToMarkdown :2496–2504 funnel through
courseworkBullets. Builder.tsx:3892 skills input placeholder "Skills used
(optional, up to 3 — e.g. Teamwork, SQL)"; :3903–3907 hint "Only the first 3
skills appear on the resume." when >3 comma-separated non-empty values;
Coursework is an optional section (chips at :5063–5074), "Add coursework"
button :3998; TXT export button :1713–1718 → downloadText(resumeToPlainText).

## Checks (all through the production UI; seed via localStorage from non-Builder page, edit via visible inputs)

- H0 bundles served.
- H1 3 skills: add Coursework section via optional-section chip, "Add coursework",
  fill name "Intro to Databases", institution "MIT OCW", date "2024", skills input
  typed "Teamwork, SQL, Python", description "Built a course project".
  Preview shows bullet exactly "Skills: Teamwork · SQL · Python" BEFORE the
  description bullet; NO hint visible (3 values). Placeholder text matches new copy.
- H2 type "a, b, c, d, e" into skills input → hint "Only the first 3 skills appear
  on the resume." renders below input; preview bullet exactly "Skills: a · b · c"
  (d, e absent anywhere in preview).
- H3 single "Teamwork" → bullet "Skill: Teamwork" (legacy form, no hint);
  clear to "  ,  " (whitespace/empty) → no Skill/Skills bullet at all, description
  bullet still renders.
- H4 messy " Teamwork ,, SQL , " → "Skills: Teamwork · SQL", no hint (2 values).
- H5 TXT export (with 3-skills state): click TXT download button; downloaded file
  contains line "- Skills: Teamwork · SQL · Python" under the coursework heading;
  byte-compare whole coursework block vs resumeToPlainText expectation. PDF/DOCX:
  buttons present and click produces a download (existence check only).
- H6 375×812: coursework editor with >3 hint visible, scrollWidth === 375.
- H7 rendered-pixel contrast of the hint text (text-muted-foreground text-xs)
  light + dark ≥4.5:1.
- H8 zero /api/ai/* completions (baseline GET /api/ai/quota ok); cleanup restores
  localStorage exactly ["honestcv.clientId","honestcv.qa"] + light theme; remove
  any .tmp-smoke/*.ts oracle files at the end (lint).

## Results (appended after production run)

## Results (production run, bundles index-Dq8jDsMR.js / Builder-hrkCQFgs.js)

- H0 bundles served + present in Builder resource entries — passed
- H1 three skills "Teamwork, SQL, Python" → preview bullet exactly "Skills: Teamwork · SQL · Python" before description; placeholder "Skills used (optional, up to 3 — e.g. Teamwork, SQL)"; no hint at 3 — passed
- H2 "a, b, c, d, e" → hint "Only the first 3 skills appear on the resume." shown; preview "Skills: a · b · c" only (no d/e) — passed
- H3 single "Teamwork" → "Skill: Teamwork" (legacy singular, no plural); whitespace-only "  ,  " → no skills bullet, description intact; hint absent both — passed
- H4 messy " Teamwork ,, SQL , " → "Skills: Teamwork · SQL", no hint — passed
- H5 TXT download full-file byte-equal to resumeToPlainText oracle (COURSEWORK block "- Skills: Teamwork · SQL · Python"); PDF (pdftotext) and DOCX (document.xml) both contain the same line; downloads via free-beta gate (honestcv.shared) + "Download anyway" final check — passed
- H6 375×812 with 5-skill hint visible: scrollWidth === 375, hint within viewport — passed
- H7 hint rendered-pixel contrast: light 4.63:1, dark 5.39:1 (both ≥4.5) — passed
- H8 zero /api/ai/* completions (__aiReqs []); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme restored — passed

Oracle: .tmp-smoke/r261_oracle.ts (removed after run) → /home/ubuntu/qa/r261_oracle.json. Screenshots: /home/ubuntu/screenshots/r261_*.png.
