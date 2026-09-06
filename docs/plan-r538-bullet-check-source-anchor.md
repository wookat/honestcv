# R538 — Bullet-quality checks point Fix at the offending bullet's real section/entry

## Production evidence (2026-08-31, cv.zalize.com, CDP 375×812)

Seeded resume: clean Experience bullets, one Projects entry whose description is
passive voice ("The dashboard was built by me using React and charts.").

- "Active voice in bullet points" fails and honestly quotes the project bullet.
- Clicking Fix → jumps to the **Experience** section top (`experience:112` in view,
  `projects:2566` off-screen) — the wrong section entirely; the quoted bullet is
  nowhere near the viewport.

## Root cause

The five bullet-line checks (`activeVoiceCheck`, `weakOpenerCheck`,
`quantifiedBulletsCheck`, `punctuatedBulletsCheck`, `bulletLengthCheck`) receive a
flattened `string[]` built from experience + projects + involvement + custom-section
bullets, so the offender's source section and entry id are discarded, and every
check hard-codes `anchor: 'experience'`. R534/R537 gave Fix entry-level precision
for structure/location checks; these content checks can't use it.

## Fix (minimal)

`src/lib/ats.ts`:
- Extend `SectionAnchor` with `'projects' | 'custom'` (both are existing Builder
  `Section` anchors; `jumpToSection` already handles them).
- The four offender-quoting checks take `{ text, anchor, id? }[]`; return the
  offender's `anchor` (fallback `'experience'`) and `entryId`.
- `quantifiedBulletsCheck` is an aggregate check — takes the same array for reuse
  but keeps its section-level `'experience'` anchor.
- Builder path builds one shared bullet-source array (experience bullets carry the
  entry id, projects/involvement descriptions carry theirs, custom-section bullets
  carry the section id with anchor `'custom'`).
- Text path (`/ats-checker`) wraps `textBulletLines` as
  `{ text, anchor: 'experience' }` — unchanged behavior (no structured ids).

`src/pages/Builder.tsx`:
- Projects and custom-section cards get `data-entry-id` + the flash-ring treatment
  (same as Experience/Education/Involvement from R534/R537) so `jumpToEntry` lands.

## Non-goals

- No change to `/ats-checker` deep links (`?jump=` list unchanged).
- No change to check wording, scoring, or fixedChecks keys (labels are the keys).
- No navigation architecture changes.

## Verification

- `npx tsc -b`, `npx eslint` on changed files, `npm run build`, `npm run verify-dist`.
- Production QA (375/1280): passive project bullet → Fix lands on the project card;
  weak-opener involvement description → involvement card; unpunctuated custom bullet
  → custom card; experience offender → exact experience card; regression: locations
  check (R537) and section-level checks unchanged; zero overflow/console errors;
  storage restored to baseline keys.
