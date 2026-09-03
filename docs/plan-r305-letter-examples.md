# R305 — Letter examples in Career documents

## Evidence (first-party)
- Rezi top navigation lists **Cover Letter Examples** ("Effective cover letter samples")
  and **Resignation Letter Examples** as first-class items alongside Resume Examples
  (https://www.rezi.ai/cover-letter-examples): per-role examples with a
  "Customize" action that loads the letter as a starting point.
- RezUp today: the Sample library covers *resumes only*; the Career documents
  section (/documents) offers New/Import actions but no example letters — a new
  user with no letter yet starts from a blank AI form.

## Plan
- New `src/lib/letterExamples.ts`: static `LETTER_EXAMPLES` array (browser-local,
  no AI, no network) — 6 role-specific cover letters (Software Engineer, Data
  Analyst, Product Manager, Marketing Manager, Customer Service Representative,
  Registered Nurse) + 2 resignation letters (standard two-weeks, short notice).
  Every fact slot is an explicit `[placeholder]` (`[Company]`, `[X%]`, `[Your
  name]`…) — honest scaffolding, nothing invented. Each letter ends with a
  closing salutation so R304 `splitAtSignature` and the signature feature work.
- Dashboard Career documents section: "Letter examples" sub-block under the
  action row — compact cards (role + kind chip) → preview dialog (reuses
  `LetterPreview` with a synthetic doc) → "Use this example" calls
  `saveCareerDoc(kind, "<Role> cover letter", text)` and opens the letter
  viewer in edit mode so placeholders can be filled immediately.
- No storage/schema/worker changes; zero effect on existing docs.

## Out of scope
- SEO pages for letter examples (resume /examples/ pipeline untouched).
- AI personalization of examples (existing letter AI tools already cover that).
