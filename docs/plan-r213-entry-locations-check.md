# R213 — "Locations on each entry" ATS structure check (Builder + /ats-checker)

## Rezi first-hand evidence

Rezi's "Using the Rezi Score" user guide (intercom.help/rezihelp, Best
Practices category, one of the 23 audits):

> "Locations - Add a geographical location to your work, involvement, and
> education experiences to give employers valuable insight into your
> adaptability and validate your experience."

## Gap in HonestCV

Experience, Education, and Involvement entries all carry a `location` field
(rendered as part of the heading line in preview/PDF/DOCX/TXT/MD), and the
sample resume fills them — but neither scoring path ever checks that entries
have one. A resume whose roles all lack locations scores identically to one
with them. Rezi audits this explicitly.

## Design

New structure check `Locations on each entry` in `src/lib/ats.ts`, same shape
as R208–R212.

- Builder (`scoreResume`): scan visible entries that have identity content:
  experience (role/company non-blank), education (school non-blank), and
  involvement (role/organization non-blank). Fail on the first entry with a
  blank `location`, hint names it ("Add a location to \"Senior Engineer at
  Acme\" — …"). Anchor is the offending entry's section (`experience` /
  `education` / `involvement` if it exists as an anchor, else `experience`)
  so the R176/R203 priority fix and R204 deep link land on the right card.
- Checker (`scoreResumeText`): plain text can't be segmented reliably into
  entries with per-entry locations, so use the R208/R209 guard style: reuse
  the experience-block date-range segmentation; each entry segment must
  contain a location-like pattern
  `/\b(?:Remote|Hybrid)\b|\b[A-Z][A-Za-z.]+,\s*(?:[A-Z]{2}\b|[A-Z][A-Za-z]+)/`
  ("Austin, TX", "Berlin, Germany", "Remote"). No heading / no date ranges /
  no segmentable entries → pass (never false-alarm on unparseable text).
  Leniency errors go toward pass by construction (e.g. "AWS, Terraform"
  inside a bullet counts as location-like) — acceptable: the check exists to
  nudge, not to punish parsing artifacts.
- Fail hint: name the offending entry and quote Rezi's rationale (validate
  experience / show adaptability). Pass hint confirms every entry has one.
- Denominators shift by design: checker 13 → 14 checks, Builder 14 → 15
  rows. Scoring formula unchanged.
- No AI, API, schema, or persistence changes; only `src/lib/ats.ts`.

## Acceptance

- Builder: sample resume (all entries located) passes; blanking one
  experience location fails naming that entry with a priority fix deep-link
  to Experience; blanking an education location anchors Education; hidden
  entries ignored; entries with no identity content ignored.
- Checker: experience block whose every entry has "City, ST" or "Remote"
  passes; an entry segment with no location-like text fails; text without an
  Experience heading or without date ranges passes (guard).
- Arithmetic: no-JD checker score = round(passed/14·100); each fix +100/14
  ≈ +7.1. Builder 15 rows.
- 375px, dark mode, and R210–R212 regressions unchanged.

## QA follow-ups folded in

- Segments include up to two header lines above each date range (bounded by
  the previous range's end), so "Company — Austin, TX" written above the
  dates credits the right entry (fixed the first QA round's P3 live).
- Known accepted leniency (P4): a "Role, Company" comma header itself matches
  the location pattern, so a location-less entry with that header
  false-passes. Safe direction per the design (never a false alarm).
