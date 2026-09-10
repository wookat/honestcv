# R809 — every structured heading's right side is typed or a placeholder while editing; a detail-first EDUCATION line is a detail

## Source

Two boundaries R808 recorded and queued:

1. R808's first production pass caught the editor preview printing `Degree ·`
   followed by an empty click-to-type span. R808 fixed Education only
   (`placeholder="School"`, heading row rendered on demand) and left the same
   convention (R771: right-side `InlineText` without a placeholder) in every
   other structured section: an experience with a role and no company reads
   `Engineer ·` + an invisible span in the Builder; the same for
   Involvement / Coursework / Certifications / Awards / Publications / Military
   service. The empty span is real (contenteditable) but has no visible text,
   so the user sees a separator to nothing and does not know the second field
   exists until they hover the right spot.
2. R808's second production pass used a fixture the parser did not support:
   a dateless detail sentence as the **first** line under `EDUCATION`
   (`First Class Honours. Final project: a journey planner.`) was stored as the
   degree. R807 frozen parser and R808 parser were byte-identical on it, so it
   was recorded as parser scope and queued.

## Evidence

`qa/r809-evidence.mts` (server-renders `ResumePreview` with the repository's
`empty*()` factories, one section at a time, head field typed, right field
empty; before the fix, this branch):

```
READONLY separator → empty span: 0      (R771/R772 already omit it)
EDITABLE separator → empty span: 7      (one per section)
   "Engineer¦  ·  ¦¦Involvement…"  "Volunteer¦  ·  ¦¦Coursework…"
   "Algorithms¦  ·  ¦¦Certifications…"  "AWS SAA¦ — ¦¦Awards…"
   "…¦ — ¦¦Publications…"  "A paper¦ — ¦¦Military…"  "Sergeant¦  ·  ¦"
```

After the fix: `EDITABLE separator → empty span: 0`, each right side reads
`Company` / `Organization` / `Institution` / `Issuer` / `Organization` /
`Venue` / `Branch`; read-only output byte-identical.

Every `Tail` call site in `src/components/ResumePreview.tsx` was inspected:

| section | head | right side | placeholder before | now |
| --- | --- | --- | --- | --- |
| Experience (grouped, location-only tail) | role | location literal | n/a (text, not editable) | unchanged |
| Experience | role | company | none | `Company` |
| Involvement | role | organization | none | `Organization` |
| Education | degree | school | `School` (R808) | unchanged |
| Coursework | name | institution | none | `Institution` |
| Certifications | name | issuer (`—`) | none | `Issuer` |
| Awards & Honors | name | organization (`—`) | none | `Organization` |
| Publications | title | venue (`—`) | none | `Venue` |
| Military service | rank | branch | none | `Branch` |

## Fix

`src/components/ResumePreview.tsx` — per call site, no change to `Tail`:

```tsx
// Experience: already rendered in edit mode; only the placeholder was missing
<InlineText value={e.company} placeholder="Company" … />

// Involvement / Coursework / Certifications / Awards / Publications / Military:
// the right-side fragment was gated on the stored value, so an empty field was
// never rendered while editing → gate on (value || editing) and add the placeholder
{(inv.organization.trim() || onEdit) && (
  <Tail head={inv.role} tail={inv.organization + inv.location} editable={!!onEdit}>
    <InlineText value={inv.organization.trim()} placeholder="Organization" … />
    …
  </Tail>
)}
```

`InlineText` only shows a placeholder when it is editable and the stored value
is empty, so read-only previews / the shared `/s/:id` page never print one;
`Tail` still omits the separator when either side is empty in read-only mode.
A fully blank structured row is still omitted (unchanged entry filters).

`src/lib/importText.ts` — two narrow edits in the education branch:

```ts
// a detail-shaped line that opens the section with no current entry, no date,
// not a degree, not a school, not a dot header → details-only entry
} else if (!currentEdu && !start && isEduDetailLine(line) && !isDegreeLine(line)
           && !SCHOOL_RE.test(line) && !looksLikeDotHeader(line)) {
  currentEdu = { ...emptyEducation(), id: newId() }
  appendDetails(currentEdu, line)
  resume.education.push(currentEdu)
}

// R807's "header under its own date line" promotion also accepts a
// details-only pending entry and keeps the details
(currentEdu.startDate || currentEdu.details) …
details: [named.details, currentEdu.details].filter(Boolean).join('; ')
```

## Rejected

- Changing `Tail` to hide the separator while editing when the right side is
  empty — hides the second field entirely (the R808 finding in reverse) and
  changes every section at once.
- One shared placeholder (`Organization`) for all sections — the field names
  differ (`Issuer`, `Venue`, `Branch`) and the Builder form labels already use
  the section-specific words.
- Teaching `isDegreeLine` to reject sentences — `First Class Honours…` is not
  a degree by any positive rule; the narrow "first line, detail-shaped,
  nothing to attach to" branch keeps every other education line untouched.

## Old / new proof

- `tests/education.test.ts` +2 (R809 block): role-only experience →
  `Engineer · Company` editing / `Engineer` read-only, company-only →
  `Role · Acme` / `Acme`; six other sections → `Volunteer · Organization`,
  `Algorithms · Institution`, `AWS SAA — Issuer`, `Top Prize — Organization`,
  `A paper — Venue`, `Sergeant · Branch` editing and the head alone read-only,
  no `·`/`—` to an empty span in either mode; blank rows omitted.
- `tests/import/rules.test.ts` +1 (R809): honours sentence alone → details-only
  row; `GPA: 3.8` alone → details-only; sentence + `BSc Computer Science ·
  University of Bristol` → one named row keeping the sentence; sentence +
  school-only line; date + sentence + header; plus R807 / inline-date controls.
- Frozen R808 checkout (`/home/ubuntu/qa/r809-wt`, `2487d0b`): the two preview
  tests fail (`expected 'Engineer ·' to be 'Engineer · Company'`,
  `Involvement: expected 'Volunteer' to be 'Volunteer · Organization'`), the
  parser test fails on the first expectation.
- Replay 186 retained texts vs frozen R808 parser (`qa/r809-replay.mts`):
  **identical 184/186; changed 2, education only** — the Stony Brook Word
  template (`word-mac-quartz-stonybrook.pdf` + pdf.js twin): its first
  EDUCATION line `Current major or if undeclared, major of interest` (template
  instruction text) was a degree/school split before and is now the detail of
  the following `Title of Bachelor's Degree / High School Name` placeholder
  row (5 → 4 / 4 → 3 rows). Both readings are placeholder text; the new one
  matches the rule. Goldens unchanged.
- Gates: `npm test` 239 / 239 (236 → 239), `tsc -p tsconfig.app.json`,
  `tsc -b`, eslint 0 errors (11 pre-existing warnings in untouched files),
  `npm run build`, `verify-dist` (123 sitemap URLs).

## Deploy + production QA

- `npm run build && node scripts/verify-dist.mjs && npx wrangler deploy`:
  30 / 30 modified assets + worker uploaded; route listing still
  `Authentication error [code: 10000]` (token lacks route-list permission;
  not redeployed for it).
- Production (cache-busted, identity encoding) `index-FAjkHGnj.js`,
  `ResumePreview-BRRe0ZnD.js`, `importText-BsQ32YWO.js`, `Builder-Dp96BW85.js`,
  `AtsChecker-C8hLuFRL.js` SHA-256 = local dist.
- Production QA: see `docs/handoff-context.md` (R809 entry) and the PR.

## Boundaries (recorded, not fixed)

- The read-only heading omits an empty right side by design; the placeholder
  words are editor-only strings and are not exported or translated (same as
  `Degree` / `School` / `Role`).
- The detail-first education branch needs the line to be detail-shaped
  (`isEduDetailLine`); a plain short sentence that is neither detail-shaped nor
  a degree still follows the pre-existing rules.
- Queue unchanged otherwise: `Engineer at Acme` headingless header;
  `Jane Doe, Senior Engineer` comma split; bare-city contact row without a
  name line; non-English document titles; page-bottom 2+2 bullet split;
  LinkedIn non-English exports; Coursework / Awards institution field width;
  grouped controls < 44 px; mobile audit panel covering controls when open.
