# R72 — Structured References section

## Firsthand evidence (Rezi, logged-in production)

Screenshot: `~/audit-r1/shots-r71/rezi-references.png` — `app.rezi.ai/dashboard/resume/<id>/references`.
Rezi's References editor is fully structured (PRO-gated feature, $29/mo tier; we ship it free):

- WHAT IS THE REFERENCE'S **NAME**? * (Full Name)
- WHAT IS THEIR **PHONE NUMBER**? (+1 123 456 7890)
- WHAT IS THEIR **EMAIL**? * (Email Address)
- REFERENCE TYPE — radio: Personal / Professional
- WHAT IS THEIR **EMPLOYER**? (Employer)
- WHAT IS THEIR **JOB TITLE**? (Title)
- Controls: SAVE TO REFERENCES LIST, Sort by date toggle

## Gap

HonestCV has no references primitive; users can only fake it with a custom section
(flat bullets — no consistent formatting across exports, no structured contact line).

## Design (mirrors R68–R71 optional built-in section pattern)

```ts
export interface ReferenceItem {
  id: string
  name: string        // reference's full name
  title: string       // their job title
  employer: string
  email: string
  phone: string
  kind: '' | 'personal' | 'professional'
}
interface Resume { references?: ReferenceItem[] } // optional — legacy resumes untouched
```

- `SECTION_KEYS` gains `'references'` after `publications`; existing saved
  `sectionOrder`s get it appended last (same R68–R71 behavior); empty section renders nothing.
- Sanitization via `asObjArr`/`asStr`; `kind` validated against the enum, else `''`.
- No new storage key, API, dependency, or import mapping.

Canonical helpers (single source across preview/PDF/DOCX/TXT/MD):

```ts
referenceEntries(r)       // entries with a non-empty name
referenceHeadingLine(x)   // "name — title, employer" omitting empty parts
referenceDetailLine(x)    // "email · phone · Personal reference" omitting empty parts
```

Rendering: bold heading line (preview/PDF/DOCX), one plain detail line under it
(no bullets — contact info is a single line, not accomplishments). TXT/MD render
heading + `- detail` / detail line.

Builder: References card after Publications — Name / Job title / Employer inputs,
Email / Phone inputs, Personal/Professional select, Add/Delete with 40px mobile
touch targets.

## Non-goals (deliberate)

- Rezi's SAVE TO REFERENCES LIST cross-resume library
- Sort by date toggle (no date on references)
- Import-mapping changes; payments; Military Service / Agents (queued separately)
