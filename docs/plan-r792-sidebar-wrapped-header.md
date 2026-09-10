# R792 — a "Role · Company, Location" header wrapped around its binder rejoins

Origin: boundary carried since R787 ("Sidebar template wraps the 78-character role
*before* its ` · ` — not rejoined") and first in the queue after R791. The R787 PDF
test deliberately skipped the Sidebar template for that reason.

## Evidence (`qa/r787-templates.mts sidebar`, run on the R791 branch)

The R787 LinkedIn-shaped fixture (`sampleResume()` with the two Kenneth roles
`Engineering Team Leader, Senior Scrum Master, Agile Transformation & Coaching · AT&T`
and `Cloud Engineering, Global Program Manager, Agile Transformation & Coaching · Ivanti,
San Francisco Bay Area`) rendered by `buildResumePdf` in every template and extracted the
way production does (`pdfPageText` with the template's `leftMargin`): 24 templates
re-import field for field; **Sidebar** yields **4 experiences** for 2 — the narrow
column wraps both headers at a space, and PDF text arrives one visual line per line:

| PDF text (Sidebar) | R791 parse |
| --- | --- |
| `Engineering Team Leader, Senior Scrum Master, Agile Transformation &` | header: role `Engineering Team Leader`, company `Senior Scrum Master, Agile Transformation &` |
| `Coaching · AT&T` | second header: role `Coaching`, company `AT&T` — takes the year and the bullets |
| `Cloud Engineering, Global Program Manager, Agile Transformation & Coaching ·` | header with an empty company (trailing binder) |
| `Ivanti, San Francisco Bay Area` | fourth header: company-shaped line |

Two wrap shapes, both produced only by our own renderer: the break **before** the
binder (first half ends with an open connector `&`) and the break **right after** it
(first half ends with ` ·`). R787's `HEADER_TAIL_RE` rule covers the third shape only
(a break inside the location: `… Ivanti, San Francisco Bay` + `Area`).

Corpus: the 186 retained texts (114 texts + 72 PDF texts) contain neither shape — the
replay below is byte-identical — so the rule is scoped to our own export.

## Change (`src/lib/importText.ts`, experience section only)

`joinWrappedHeader(line, next)` runs before the experience-section branches and, when
it matches, the two lines are parsed as one header (the second line is consumed):

- `line` ends with ` ·` → join if the pair passes `looksLikeDotHeader` (≤ 120 chars,
  ≤ 18 words, ` · ` present, no sentence punctuation at the end).
- `line` ends with `&` / `/` / `,` / ` and` / ` or`, carries no ` · ` itself, does not
  start lowercase, has ≤ 14 words and no date; `next` is itself a dot header; the pair
  passes `looksLikeDotHeader`.
- Never when either line is a bullet, and never when `next` is a bare date line
  (`extractDates(next).start && !rest`) — a header followed by its dates line stays two
  lines.

Bullets that wrap at `&` (`… the checkout &` + `the ledger service`) still go through
`continuesPrevious`; a marker-less sentence under an entry is untouched; the existing
`HEADER_TAIL_RE` (location wrap) and `looksLikeWrappedHeader` (`Company,` + `Location`)
rules are unchanged.

## Tests

- `tests/import/rules.test.ts` + 2: both shapes rejoin with the year and bullets on the
  right entry (fails on the R790 / R791 parser: 4 experiences); guard — a bullet wrapped
  at `&`, a marker-less sentence and a header followed by its date line are not joined
  (passes on both).
- `tests/pdf.test.ts`: the R787 LinkedIn-shaped test now runs on **all 25 templates**
  (Sidebar was excluded); `npm test` 179 → 181. Goldens unchanged.

## Local

- `qa/r787-templates.mts sidebar`: 25 / 25 templates re-import field for field (was 24 +
  `DIFF sidebar: exp 4`).
- 186-file parser replay (`qa/r791-parse-replay.mts`, R790 parser vs branch): **186 / 186
  identical** — the rule fires on no retained text.
- Gates: tsc app + worker + test, eslint (changed files), vitest 181, build, verify-dist
  green.

## Boundaries

- Only the experience section; the education / project header paths do not wrap this way
  in our templates (school lines are short, project titles are one line in Sidebar).
- Only the two connector shapes above; a role wrapped at a plain space with no connector
  (`… Global Program` + `Manager · Ivanti`) is still two lines — the corpus and our
  exports show no such case (the renderer wraps at the last space before the column
  edge and the roles here break at connectors), so it is not modelled.
- Pasted text with a genuinely two-line header (a user's line break) benefits in the same
  way; a user who wants `Coaching · AT&T` to be its own entry after a header ending in `&`
  cannot get that from paste — accepted, no such resume in the corpus.
