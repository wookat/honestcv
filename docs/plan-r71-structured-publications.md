# R71 — Structured Publications section

## Firsthand evidence (2026-08-29, logged-in Rezi audit)

- `~/audit-r1/shots-r70/rezi-academic-submenu.png` — Rezi's **Academic ›** submenu lists
  **Awards & Honors** (shipped in R70) and **Publications** (PRO-gated).
- `~/audit-r1/shots-r71/rezi-publication.png` — the Publications editor is fully
  structured: *PUBLICATION TYPE* (required), *What is the PUBLICATION TITLE* (required),
  *What is the JOURNAL/CONFERENCE NAME of the publication?*, *WHEN did you publish the
  publication?* (year), *OPEN FIELD FOR ADDITIONAL INFORMATION* (bullet description),
  plus Save-to-list and Sort-by-date controls.
- Also captured this round (future candidates, not selected):
  `rezi-references.png` (name*/phone/email*/type radio/employer/title),
  `rezi-military.png` (rank*/branch*/date range/stationed/bullets),
  `rezi-agents.png` (agent name*/when/skills/relevance).

## Gap

RezUp has no publications primitive. Academic/research users can only use a custom
section (title + flat bullets): no per-publication venue/date, no consistent formatting
across Preview/PDF/DOCX/TXT/Markdown. Rezi charges $29/mo for this; we ship it free.

## Design

```ts
export interface PublicationItem {
  id: string
  title: string        // publication title
  venue: string        // journal / conference name
  date: string         // when published, e.g. "2026"
  description: string  // additional information; one bullet per line
}
interface Resume { publications?: PublicationItem[] }  // optional — legacy unaffected
```

- No new storage key; `publications` lives inside `honestcv.resume` and is sanitized
  with the existing `asObjArr`/`asStr` helpers.
- `SECTION_KEYS` gains `'publications'` after `awards` (fresh defaults); resumes with a
  saved `sectionOrder` get it appended by `orderedSectionKeys` (same behavior as
  R68–R70 — user order is never rewritten).
- Canonical helpers (single source of truth for all render paths):
  - `publicationEntries(r)` — entries with a non-empty title or venue
  - `publicationHeadingLine(p)` — `title — venue` (award style)
  - `publicationBullets(p)` — non-empty trimmed description lines
- Rendering: Preview + PDF use the experience-style bold heading with right-aligned
  italic date; DOCX/TXT/Markdown flatteners reuse the same helpers.
- Builder: "Publications" section after Awards & honors with title / venue / date
  inputs, description textarea (one bullet per line), Add/Delete controls at ~40px on
  mobile.

## Non-goals

- Rezi's required publication-type dropdown (taxonomy without render impact — the
  heading line already reads naturally without it) and Sort-by-date toggle.
- References / Military Service / Agents (evidence in hand; separate rounds).
- No new API, dependency, storage key, or import-mapping changes.
