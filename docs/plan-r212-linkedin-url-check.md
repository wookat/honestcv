# R212 — "LinkedIn URL" ATS structure check (Builder + /ats-checker)

## Rezi first-hand evidence

Rezi's "Using the Rezi Score" user guide (intercom.help/rezihelp, one of the 23
audits, Best Practices category):

> "LinkedIn URL - Give a backstage pass to your professional life with your
> LinkedIn URL to show beyond what's listed on your resume (in/fullname)."

## Gap in HonestCV

We have a LinkedIn contact field (normalized/linkified since R170, hideable
since R143) and the sample resume ships one, but neither ATS scoring path ever
looks at it — a resume with no LinkedIn URL scores identically to one with it.
Rezi audits this explicitly.

## Design

New structure check `LinkedIn URL` in `src/lib/ats.ts`, same shape as
R208–R211. Anchor `contact` so the R176/R203 priority fix and the R204
"Fix in builder →" deep link land on the contact section.

- Builder (`scoreResume`): pass iff `resume.contact.linkedin` is non-blank
  AND `'linkedin'` is not in `resume.hiddenContact` (a hidden field never
  reaches the rendered resume, so it must not count).
- Checker (`scoreResumeText`): pass iff the pasted/extracted text matches
  `/linkedin\.com\//i`. Bare "in/fullname" without the domain is not
  recognized — too many false positives (e.g. "in/out"), and Rezi's own
  guidance shows the full URL form.
- Fail hint: "Add your LinkedIn URL (linkedin.com/in/yourname) — recruiters
  use it to verify and expand on your resume." Pass hint confirms it was
  found.
- Denominators shift by design: checker 12 → 13 checks, Builder 13 → 14
  rows. Scoring formula unchanged.
- No AI, API, schema, or persistence changes; only `src/lib/ats.ts`.

## Acceptance

- Builder: sample resume (linkedin.com/in/jordanreyes) passes; clearing the
  field fails with the hint and a priority fix deep-linking to Contact;
  hiding the LinkedIn field (R143 toggle) with data still present also fails.
- Checker: pasted text containing "linkedin.com/in/jordan" passes; same text
  without it fails with anchor `contact`; "in/jordan" alone does not pass.
- Arithmetic: no-JD checker score = round(passed/13·100); each fix +100/13.
- 375px, dark mode, and R208–R211 regressions unchanged.
