# R561 — /jobs Tailoring report gets an action path for missing keywords

## First-hand production evidence (CDP, 1280×900, seeded 1-role draft)
- /jobs?q=react → select "Senior React Full-stack Developer" → open "Tailoring report":
  report says "covered 2 of 30 job keywords" and names 28 missing keywords
  (10 high-priority + "+16 more" + "Also missing"), but the ONLY interactive
  elements inside the report are "Hide tailoring report" and "+16 more".
- The named keywords have no action path: the user must know to click
  "Target my resume" elsewhere in the pane, land in /builder, and then find
  the Target job panel where the R542/R544 chips (add-to-skills / dismiss)
  actually let them act on each keyword.
- Rezi comparison (rezi-changelog, Aug 2026): job tailoring flows lead
  directly from match reports into the tailoring editor.

## Fix (minimal)
`src/pages/Jobs.tsx` only:
- Extend `confirmTarget` intent union with `'keywords'` (treated as `'target'`
  everywhere in the dialog copy/labels).
- `targetResume`: for the target-style intents, navigate to
  `/builder?jump=target` when intent is `'keywords'`, `/builder` otherwise.
- Report footer (when `selectedReport.missing.length > 0`): a small
  "Add these keywords in the editor →" button that calls
  `setConfirmTarget({ job: selected, intent: 'keywords' })` — same honest
  confirm dialog as "Target my resume", landing on the Target job panel
  where each missing keyword is an actionable chip.

## Non-goals
No changes to scoring, extraction, report contents, chips in Builder,
pipeline persistence, or the existing Target/cover flows' destinations.

## Validation
tsc -b, eslint Jobs.tsx, build, verify-dist; deploy (known Workers Routes
code 10000 caveat); production QA at 1280/375: footer action present, confirm
dialog correct, lands on Target panel with keyword chips inView; R559/R560
regressions; storage restored to six-key baseline.
