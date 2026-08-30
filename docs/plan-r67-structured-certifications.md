# R67 — Structured certification entries

## Evidence (first-hand, 2026-08-29)

- Rezi editor hidden-section menu (`shots-r67/rezi-tab-overflow.png`, `rezi-certifications-editor.png`):
  Project / Certifications / Coursework / Involvement are opt-in sections.
- Rezi Certifications editor (`shots-r67/rezi-certifications-editor2.png`, route
  `/dashboard/resume/<id>/certification`): structured entries with fields
  - WHAT WAS THE CERTIFICATE **NAME**? * (e.g. "Project Management Professional (PMP)")
  - **WHERE** DID YOU GET THE CERTIFICATE? (e.g. "Project Management Institute")
  - **WHEN** DID YOU GET THE CERTIFICATE? (e.g. "2026")
  - HOW IS THE CERTIFICATE **RELEVANT**? (bullet-style description)
  - Sidebar entry list with add (+) and "Sort by date" toggle.

## Gap in RezUp

`Resume.certifications` is a single free-text string; the Builder has one input,
and all five render paths (preview/PDF/DOCX/TXT/MD) print the raw string. Users
cannot express issuer/date/relevance per certificate, and imports flatten
parsed certificates into text.

## Scope (R67)

- `CertificationItem { id, name, issuer, date, description }` — new optional
  `certItems: CertificationItem[]` on `Resume` (default `[]`), sanitized via
  existing `asStr`/`asObjArr`. Legacy `certifications` string field is kept
  unchanged for backward compatibility and continues to render as a plain
  paragraph after the structured entries.
- Single source of truth helper `certHeadingLine(c)` = `name — issuer`
  (skip empty parts), date rendered right-aligned like experience/education.
- Builder: "Certifications" gains an entry list editor (Name, Issuer, Date,
  Relevance) with Add/Remove; the legacy free-text input remains beneath as
  "Additional certifications (one line)".
- Preview/PDF/DOCX/TXT/MD all render structured entries + legacy string;
  the section is non-empty if either is present.

## Non-goals

- No migration/auto-parsing of the legacy string into entries (lossy risk).
- No changes to `importText`/`resumeCenter` mappings (they keep writing the
  legacy string; structured import is a later round once evidence justifies it).
- No "Sort by date" toggle, no new storage keys/APIs/dependencies.

## Acceptance

- Entry `AWS Solutions Architect / Amazon Web Services / 2024 / Validated…`
  renders as `AWS Solutions Architect — Amazon Web Services` with right-aligned
  `2024` and the relevance line, in preview and PDF.
- Legacy resumes with only the string field render exactly as before.
- Empty parts leave no dangling separators; reload persists; 375px no overflow.
- `npm run lint`, `npx tsc -b`, `npm run build` green.
