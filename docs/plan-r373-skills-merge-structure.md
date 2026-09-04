# R373 — assistant "Add to skills" preserves category structure

## Evidence (production, R373 assistant depth audit)
- Assistant quick-task chain audited end-to-end on `index-CLVnPsCm.js` (all /api/ai/assistant
  POSTs mocked pre-dispatch, zero quota). Only P2 found: applying a skills proposal destroys
  category structure. With skills seeded as two categorized lines
  `Marketing: SEO, Content strategy, Copywriting` / `Tools: Google Analytics, Ahrefs, HubSpot,
  Email marketing`, "Add to skills" with 2 new skills collapsed everything into one flattened
  comma line with the literal `Tools:` label mid-list, and a proposed skill matching an existing
  categorized item was not deduped.
- Root cause (source): Builder's skills apply handler splits `r.skills` on `[,\n]` and rejoins
  with `', '` — newlines are lost and a categorized line's first token is `Label: item`, so both
  structure and dedupe break.
- Other audit results banked, no fix this round: P3 "Improve my ATS score" on an empty resume
  cites the 63/100 baseline floor (misleading at the empty extreme); P3 jobDescription has no
  size guard in the assistant payload (20.8KB sent verbatim; cost-only concern).

## Design (deterministic)
`mergeSkills(existing, added)` in resume.ts:
- Parse existing into trimmed non-empty lines; item tokens come from each line's part after an
  optional `Label:` prefix, split on commas. Dedupe added skills case-insensitively against
  every existing item (labels excluded) and against each other.
- Nothing new → return `existing` byte-identical.
- Empty block → `fresh.join(', ')`.
- Single unlabeled line → append to that line with `', '` (previous happy-path behavior kept).
- Multi-line or labeled block → keep lines verbatim and append the new skills as one new line.
Builder's apply branch becomes `skills: mergeSkills(r.skills, action.value)`.

## Acceptance
- Categorized 2-line block + 2 new skills → both lines byte-identical, additions on line 3.
- Proposal item equal (case-insensitive) to an item inside a category → dropped.
- Plain single line unchanged behavior; empty skills; all-duplicates proposal returns the exact
  prior string. Oracle covers each; tsc/eslint/build green; production QA re-runs the audit
  repro plus 375 light/dark and R372 regression.
