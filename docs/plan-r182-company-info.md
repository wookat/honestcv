# R182 — Company information field on experience entries

## Evidence (Rezi public changelog, October 2024)

"Company Information Field & Input — Including basic information about the
companies you've worked for can improve your resume. It gives employers
context about your experience, especially if the company isn't well-known.
… Additionally, adding company information helps the AI Writer produce
better, more relevant suggestions. By including details about the companies
you've worked for, Rezi gains valuable context."

## Current state

`ExperienceItem` has company/role/location/dates/bullets only. Employers get
no context for unknown companies, and the AI bullet writer receives just the
company *name* (`buildSuggestBulletMessages(role, company, …)`).

## Change

1. Schema: `companyInfo?: string` on `ExperienceItem` (one short line, e.g.
   "Series B fintech, ~200 people, B2B payments"). Added to `sanitizeResume`
   and the share-page entry sanitizer; persists through reload and /s/ pages.
2. Editor: optional single-line input "About the company" on the Experience
   card with placeholder guidance; entity-aware label (R158 style).
3. Rendering: when non-empty, an italic muted line directly under the entry
   heading in the live preview, PDF (italic, body size −1), DOCX (italic run),
   TXT (plain line), and Markdown (`*…*`). Hidden entries already filtered.
4. AI writer: suggest-bullet endpoint (both variants) accepts `companyInfo`
   (trimmed, ≤300 chars) and injects `Company info: …` into the user prompt,
   so drafts reflect the company's domain/scale. Other AI endpoints see it
   via `resumeToPlainText` automatically once rendered in TXT.
5. ATS/scoring: included in the resume plain text like other content — no
   formula change.

## Non-goals

No schema migration beyond the additive optional field, no new AI calls, no
payment/Cloudflare/Actions changes, no group-heading (R161) restructure —
grouped view shows the info line under the first entry of the group's company
heading only when that entry carries it.

## Acceptance

- Enter info → appears in preview/PDF/DOCX/TXT/MD under the heading; clears
  when emptied; reload + share page keep it.
- Suggest-a-bullet prompt includes the info (verified by a real call whose
  draft reflects the company domain).
- Lint/typecheck/build green; production QA 1440+375; R161/R141 smoke.
