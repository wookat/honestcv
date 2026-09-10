# R797 — our own Involvement / Coursework / Certifications / Awards / Publications / References / Military service re-import into their fields

## Evidence (first-hand, `qa/r797-evidence.mts`, `qa/r797-fields.mts`)

R789 made every heading the product prints a heading to the importer, but
recorded a boundary: the optional structured sections were opened as **custom
sections** — "content kept, shape not". A resume carrying one entry in each
optional section (certification with issuer / date / description; involvement
with organisation / location / dates / two bullets; coursework with skill
line; award; publication with `(Talk)` kind; reference with e-mail / phone /
kind; military service) exported to TXT / MD / PDF (25 templates) / DOCX and
parsed with the R796 parser:

| field | source | R796 re-import (TXT = MD = PDF = DOCX) |
| --- | --- | --- |
| `certItems` | 1 | 0 — `certifications` flat text `"AWS Solutions Architect – Associate — Amazon Web Services (2023); Designed the multi-region failover for Northstar."` |
| `involvement` / `coursework` / `awards` / `publications` / `references` / `military` | 1 each | 0 each — six custom sections titled `Involvement` … `Military service`, entries flattened to bullets |

In the Builder that means: re-importing your own export moves every one of
those entries out of its form (dates, locations, issuer, reference contact,
publication kind all become free text under a custom heading), the section
order loses the entries' sections, and the ATS structured score no longer sees
certifications / references as such.

## What the exports print (shapes, `src/lib/resume.ts` serialisers)

| section | header line | detail |
| --- | --- | --- |
| Involvement | `role · organization, location (start – end)` | `- description` bullets |
| Coursework | `name · institution (date)` | `- Skills: …` line, then description bullets |
| Certifications | `name — issuer (date)` | un-bulleted description line |
| Awards & Honors | `name — organization (date)` | description bullets |
| Publications | `title — venue (kind) (date)` | description bullets |
| References | `name — title, employer` | `email · phone · Personal/Professional reference` |
| Military service | `rank · branch, location (start – end)` | description bullets |
| Agents | `name (date)` | `Skills used: …` + bullets |

PDF / DOCX print the date on its own line (right-aligned) and the
certification description without a glyph; TXT / MD print `(date)` inline.

## Options considered

- **Route those headings straight into structured parsers in the main state
  machine** — every arbitrary external `PUBLICATIONS` / `REFERENCES` list
  (APA citations, bare names, "available on request") would have to be
  reasoned about inline, and the generic custom-section fallback the corpus
  relies on would be bypassed. Rejected.
- **Keep them custom, add nothing** — the R789 boundary; the loss is
  user-visible on every round trip of our own export. Rejected.
- **Parse as custom, then lift** (chosen) — the section is parsed exactly as
  before (custom section with normalised bullets) while the raw lines are
  kept alongside; after the parse, a section whose heading is a product-owned
  optional heading (`OWN_HEADINGS` keeps the section key now) is handed to a
  key-specific lifter that succeeds **only when every entry has our shape**
  (a date, or a ` · ` / ` — ` binder, plus the section's detail rules).
  Anything else stays exactly the custom section / flat certification text it
  was.

## Fix (`src/lib/importText.ts`)

- `OwnHeading` carries the section `key` for non-core labels (default labels
  in five languages and the reader's saved renames alike).
- `customRaw: WeakMap<CustomSection, string[]>` — raw lines per custom
  section, maintained by `openCustom` / `pushCustom` / `joinCustom` (gutter
  label, inline heading and generic heading paths). A reference contact row
  (`email · phone · … reference`) is never joined onto the previous line.
- Post-pass `liftCertifications(certLines)` → `certItems`, else the previous
  `certifications = certLines.join('; ')`; `liftOwnSections(resume, customRaw)`
  → `involvement` / `coursework` / `awards` / `publications` / `references` /
  `military` / `agents`, removing the custom section only when the lift
  succeeded.
- `groupOwnEntries(raw, plainIsDetail, { kind })`: header line (dates
  extracted by the shared `extractDates`; a bare date line directly under a
  header is its date), bullets → description, un-bulleted detail lines only
  where the section allows them (certification description, reference
  contact row, coursework / agents skills line); a bullet before any header,
  a stray bare date, or an empty header aborts the lift for the whole
  section.
- Split rules: ` · ` (or ` — `) then `, ` → `left / right / location`
  (involvement, military, coursework without location); ` — ` → `name /
  issuer|organization|venue`; trailing `(kind)` that is not a date →
  publication `kind`; reference `name — title, employer` + detail row split
  on ` · ` into e-mail (`EMAIL_RE`), phone (`PHONE_RE`), kind
  (`personal|professional reference`).
- Certifications: lifted only when every entry has a ` — ` binder or a date;
  a comma list or a bullet list stays flat text as before.

## Tests

- `tests/import/ownSections.ts` — shared fixture (`withOwnSections`) and
  comparator (`ownSections`, ids stripped, keys sorted).
- `tests/import/rules.test.ts` + 4: TXT / MD round trip of all seven sections
  field for field with no custom section left and empty `certifications`;
  guards — APA-style publication bullet list stays custom, name-only
  involvement list stays custom, comma-list and bullet-list certifications
  stay flat text; a section mixing our shape with a plain line is not
  half-lifted; the PDF shape (date on its own line, plain certification
  description, reference contact row) parses equal to the TXT shape. R789's
  three heading tests updated from "opens a custom section" to "opens its
  section" (the R789 boundary this round closes); `Servicio militar` letter-
  spaced heading now yields `military` with `rank` / `branch`.
- `tests/pdf.test.ts` + 1: 24 full-width templates re-import the seven
  sections field for field (Sidebar excluded — see boundaries).
- `tests/docx.test.ts` + 1: DOCX ≡ TXT ≡ source.
- Golden `tests/import/golden/pdf/synth-sidebar.pdf.json`: the synthetic
  sidebar's `CONTACT` custom section now keeps `555-222-1111` and
  `daniel.okafor@example.com …` as their own rows instead of one glued line
  (the reference-contact no-join rule; same change as the replay below).

`npm test` 199 → 205.

## Replay (`qa/r797-parse-replay.mts`, R796 parser byte copy `src/lib/_r796_importText.ts`)

114 texts + 72 PDF extractions: **185 / 186 identical**. The one change is
`synth-sidebar.pdf` `CONTACT` above (phone and e-mail rows no longer joined
onto the location row). No corpus file gained a structured optional section —
none of the 186 real-world files prints our header shapes — so the lift is
confined to our own exports.

## Boundaries

- A product-owned heading whose entries are not all in our shape stays a
  custom section (or flat certification text); nothing is half-lifted.
- The publication `kind` is only a trailing parenthesised non-date value; a
  venue containing parentheses would be read as kind.
- Reference detail rows are recognised for e-mail / phone / `Personal|
  Professional reference` only (what the product prints).
- **Sidebar PDF** (found while writing the template test, pre-existing, not
  this round): with this many sections the extractor's two-column split
  reads Sidebar's label column as a sidebar and detaches every heading from
  its content — the sample re-imports as 1 empty experience on the R796 parser
  as well. The sample resume without the optional sections still re-imports
  correctly on Sidebar. Queued first for R798.
