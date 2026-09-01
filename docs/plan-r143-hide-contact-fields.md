# R143 — Show-on-resume toggles for contact fields

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's Contact page pairs its location fields with a **"Show on resume"** switch:
Country and State each carry a toggle so the data stays on file but is left out of
the rendered resume. This is the contact-field analog of the per-entry
"Hide from resume" menu we aligned in R141/R142 — Rezi treats *everything* on the
resume as hideable-without-deleting.

RezUp today: the only way to keep a phone number or location out of a tailored
copy is to delete the text from the field. That loses the data — the exact
failure mode R141 fixed for entries.

## Scope

Per-field hide toggles for the five optional contact fields: **email, phone,
location, website, linkedin**. `fullName` and `title` are not toggleable (a
resume without a name is never wanted; Rezi doesn't offer it either).

## Design

- `Resume.hiddenContact?: ContactField[]` where
  `type ContactField = 'email' | 'phone' | 'location' | 'website' | 'linkedin'`.
  Sanitizer keeps only valid keys, deduped; absent/empty ⇒ nothing hidden.
- `visibleResume()` additionally blanks hidden contact fields
  (`contact: { ...r.contact, phone: '' , ... }` for each hidden key) — every
  output boundary (preview, PDF/DOCX/TXT/MD, ATS, AI context, share, dashboard)
  already consumes `visibleResume`, so filtering is inherited for free. A blank
  field is exactly how "absent" already renders everywhere (separators collapse,
  icons drop — R136-verified paths).
- Builder contact card: Eye/EyeOff ghost toggle beside each of the five inputs
  (`aria-pressed`, per-field aria-label), input row dimmed `opacity-60` while
  hidden. Editing stays enabled while hidden.
- Undo/redo: toggles go through `setResume` like any edit.
- Preview inline contact editing (R136) naturally skips hidden fields — the span
  isn't rendered, same semantics as hidden entries in R141/R142.

## Non-goals

- No new dependency, storage key, or schema migration.
- No Country/State split — RezUp's single free-text `location` keeps its shape.
- No hiding of fullName/title.

## Verification

Local lint/build green; deploy; on production at 1440+375: hide phone +
location → gone from preview/TXT instantly with clean separators, data still in
the inputs; toggle back restores; reload persists; undo/redo works; ATS contact
checks recompute; R136 inline contact editing regression on visible fields;
R141/R142 entry hiding regression.
