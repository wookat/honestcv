# R810 — an unheaded "Role at Company" / "Role — Company" is the first job; "Name, Title" splits into name and title

## Source

Two boundaries recorded since R802 / R806 and queued through R809:

1. `Senior Engineer at Acme Corp` (or `Senior Engineer — Acme Corp`) pasted
   under the contact block with **no `EXPERIENCE` heading** was stored as the
   professional title, and its date line / bullets opened one blank
   experience entry (`['', '', '', '', 1]`). The same header under an explicit
   heading, or bound by `·` / `|` (R802 / R806), already read as a job. The
   entry-header parser knew `at` / `—` as binders (`ENTRY_HEADER_BINDER_RE`,
   `splitRoleCompanyRaw`); only the "body has begun" detector
   (`isHeadlessEntryHeader`) did not.
2. `Jane Doe, Senior Engineer` as the header row was stored whole as the name
   (title empty) — Builder name box, every template, share title, TXT / MD
   header and letter sign-off print the comma and the title. R806 split
   `Name | Title` / `Name · Title` / `Name • Title` and recorded the comma as a
   boundary because the same comma binds `Jane Doe, PhD`,
   `Director, Engineering`, `Acme, Inc.` and `City, ST`.

## Evidence

- `qa/r810-evidence.mts` — 186 retained texts (R776 text replay + R786 PDF
  extractions + R773 LinkedIn PDFs), first 12 header lines, short capitalised
  `at` / dash lines without e-mail / phone / year: 4 matches, all LinkedIn
  headlines of the shape `Advanced Data Scientist at Honeywell` followed by a
  location line — a headline, not a headless entry (no date / bullet under
  it), so the corpus contains **no** instance of either defect shape; both come
  from paste shapes (`qa/_r810probe.mts`, 8 shapes A–H).
- Before (frozen R809 parser):
  ```
  A_at_noheading   title="Senior Engineer at Acme Corp"  exp=[["","","","",1]]
  F_at_bullets     title="Senior Engineer at Acme Corp"  summary="- Built…"  exp=[["","","","",1]]
  G_at_dash        title="Senior Engineer — Acme Corp"   exp=[["","","","",1]]
  C_comma          name="Jane Doe, Senior Engineer"      title=""
  ```
- After:
  ```
  A  title=""  exp=[["Senior Engineer","Acme Corp","Jan 2020","Present",2]]
  F  title=""  summary=""  exp=[["Senior Engineer","Acme Corp","","",2]]
  G  title=""  exp=[["Senior Engineer","Acme Corp","Jan 2020","Present",1]]
  C  name="Jane Doe"  title="Senior Engineer"
  B (explicit heading), D (`Jane Doe, PhD`), E (`Director, Engineering`),
  H (`Engineer with 8 years at scale-ups and at Acme.` → title) unchanged.
  ```

## Fix (`src/lib/importText.ts`)

```ts
// headless entry header: "·" / "|" bind unconditionally (R802 / R806);
// "at" / "—" / "–" also occur in prose, so they need a header shape
const AT_DASH_BINDER_RE = /[\p{L})]\s(?:at|—|–)\s[A-Z0-9]/u
const bindsEntryHeader = (line) => {
  if (/\S\s(?:·|\|)\s\S/.test(line)) return true
  if (!AT_DASH_BINDER_RE.test(line) || looksLikeBodyLine(line)) return false
  const { role } = splitRoleCompanyRaw(line)
  return JOB_TITLE_NOUN_RE.test(role) && !/\d/.test(role) && role.split(/\s+/).length <= 6
}
const isHeadlessEntryHeader = (line, next) =>
  bindsEntryHeader(line) && !isContactRow(line) &&
  (bareDate(next) !== null || isBullet(next) || (dated inline))

// name scan, after the "|"/"·" row check
const comma = line.split(/,\s+/)
if (comma.length === 2 && NAME_HEAD_RE.test(comma[0]) && !JOB_TITLE_NOUN_RE.test(comma[0])
    && !isExpPlaceLine(line) && JOB_TITLE_NOUN_RE.test(comma[1])
    && !/\d/.test(comma[1]) && comma[1].split(/\s+/).length <= 6) { parts = comma; named = true }
```

- `at` / dash header: left side must be a job title (`JOB_TITLE_NOUN_RE`, no
  digits, ≤ 6 words), the line must not be body-shaped, must not be a contact
  row, and must sit over a date line / bullet or carry its own dates — the
  same "body has begun" conditions R802 / R806 use for `·` / `|`. Prose such
  as `Engineer with 8 years at scale-ups and at Acme.` fails
  `looksLikeBodyLine` and stays the title; `Lives at 12 Main St — Austin, TX`
  has no title noun on the left.
- comma name row: exactly two segments; left is a 2–4-word capitalised name
  with **no** title noun (`Senior Director, Engineering` is not a name); right
  carries a title noun, no digits, ≤ 6 words (`PhD` / `MBA` / `Inc.` carry no
  title noun → the line stays whole; `City, ST` fails via `isExpPlaceLine`).
  Title segments join through the existing R806 path.

## Rejected

- Treating every `at` line as a binder (the pre-R810 `ENTRY_HEADER_BINDER_RE`
  shape) — `8 years at scale-ups` prose and `Lives at …` would open jobs.
- Reusing `splitRoleCompanyRaw` for the comma name row — its comma branch is
  tuned for `Role, Company, Location` and would split `Jane Doe, PhD`.
- Requiring a contact row under the comma row — the `|` / `·` split (R806) has
  no such requirement and the extra condition would miss a
  `Name, Title` line followed directly by a summary.
- A credential-suffix blacklist (`PhD|MBA|CPA|…`) — the positive "title noun on
  the right, none on the left" rule already leaves every suffix alone without
  a list to maintain.

## Old / new proof

- `tests/import/rules.test.ts` +2 (R810): `at` + dates, `—` + dates, `at` +
  bullets only → one job with role / company / dates / bullets, title and
  summary empty; explicit-heading control; prose-with-`at` title control;
  `Lives at … — Austin, TX` and `jane@example.com at gmail — 555…` controls.
  Comma: `Jane Doe, Senior Engineer` and `Mary-Jane O'Neil, Registered Nurse`
  split; `Jane Doe, PhD` / `Jane Doe, MBA` whole; `Director, Engineering` and
  `Senior Engineer, Acme, Inc.` stay titles; `Senior Director, Engineering`
  over the name is not the name; `New York, NY` stays the location (R803).
- Frozen R809 checkout (`/home/ubuntu/qa/r810-wt`, `3197191`): both tests
  fail (`title: "Senior Engineer at Acme Corp"`, `exp [["","","","",1]]`;
  `name: "Jane Doe, Senior Engineer"`).
- Replay 186 retained texts vs frozen R809 parser (`qa/r810-replay.mts`):
  **identical 186/186; changed 0**.
- Gates: `npm test` 241 / 241 (239 → 241), `tsc -p tsconfig.app.json`,
  `tsc -b`, eslint 0 errors (11 pre-existing warnings in untouched files),
  `npm run build`, `verify-dist`.

## Deploy + production QA

(filled in after deployment)

## Boundaries

- A headless `Role at Company` whose left side has no `JOB_TITLE_NOUN_RE` word
  (`Barista at Blue Bottle` is covered; `Sommelier at …` is not) still needs a
  heading or a `·` / `|` binder.
- `Name, Title` with a title that carries no title noun (`Jane Doe, Growth`)
  stays whole; `Name, Title, Company` (three segments) stays whole.
- A LinkedIn headline `Role at Company` followed by a **location** line (the
  four corpus matches) is still the title — that is the correct reading.
