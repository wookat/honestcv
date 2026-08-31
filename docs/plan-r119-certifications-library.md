# R119 — Certifications Library

## First-hand evidence (this round)

Earlier rounds (R116–R118) probed `/certifications` and `/publications` (plural)
on the Rezi sample resume and only got the app shell — those routes are simply
not the editor URLs. This round probed singular routes and both editors render
fully (`shots-r119/probe-certification.png|.txt`, `probe-publication.png|.txt`):

- `/certification`: "Certifications 1 · WHAT WAS THE CERTIFICATE NAME?* ·
  WHERE DID YOU GET THE CERTIFICATE? · WHEN DID YOU GET THE CERTIFICATE? ·
  HOW IS THE CERTIFICATE RELEVANT? · **SAVE TO CERTIFICATIONS LIST**"
- `/publication`: "PUBLICATION TYPE* · WHAT IS THE PUBLICATION TITLE* ·
  journal/conference · date · additional info · **SAVE TO PUBLICATIONS LIST**"

So Rezi's save-to-list family does include Certifications and Publications.
This round takes Certifications (small batch); Publications is next round's
candidate with evidence already on file.

## Design

Mirror the R117 awards-library pattern exactly — `CertificationItem` has the
same shape class (id + 4 always-present strings: name, issuer, date,
description).

- `SavedCertification { id, savedAt, data: CertificationItem }`
- localStorage key `honestcv.certLibrary`, max 30, newest first
- `sanitizeCertificationItem`: all five keys always present (`asStr`), entry
  valid iff `name` OR `issuer` OR `description` is non-blank (date alone is
  not a certification)
- `listCertLibrary` / `saveCertToLibrary` / `deleteLibraryCert`: malformed
  JSON, non-arrays, rows missing an outer `id` or numeric `savedAt`, and
  rows whose `data` fails sanitization are silently dropped; storage
  exceptions swallowed; fresh nested `data.id` at save time
- Builder Certifications section: per-entry BookmarkPlus
  (`Save certification N to library`, disabled when name+issuer+description
  all blank, green check 1.6 s), `From library (n)` toggle hidden when empty,
  panel rows `name — issuer` (fallback "Untitled certification") + saved
  date with Insert/Delete (h-10 mobile / sm:h-7 desktop), Insert appends
  `{ ...data, id: newId() }` and replaces a sole all-blank placeholder

## Non-goals

No schema/AI/scoring/export/Worker changes; legacy free-text
`certifications` string untouched; Publications library deferred to R120.

## Validation

Local lint + tsc + build; deploy; production QA (save fidelity, guards,
insert semantics, malformed data, ten-library regression, preview/PDF,
375px, zero AI, byte-for-byte localStorage restore).
