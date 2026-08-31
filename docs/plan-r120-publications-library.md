# R120 — Publications Library

## First-hand evidence (captured in R119's audit)

`shots-r119/probe-publication.png|.txt`: Rezi's `/publication` editor renders a
full structured form — "PUBLICATION TYPE* · WHAT IS THE PUBLICATION TITLE* ·
WHAT IS THE JOURNAL/CONFERENCE NAME OF THE PUBLICATION? · WHEN DID YOU PUBLISH
THE PUBLICATION? · OPEN FIELD FOR ADDITIONAL INFORMATION ·
**SAVE TO PUBLICATIONS LIST**". This is the last member of Rezi's save-to-list
family with verified evidence that we don't yet cover.

Note on shape: Rezi has a "publication type" dropdown our `PublicationItem`
(R71: id/title/venue/date/description) lacks. Adding a type field would be a
schema change (out of scope for a library round); the library mirrors our
existing structured model.

## Design

Mirror R117/R119 exactly — `PublicationItem` is the same shape class
(id + 4 always-present strings):

- `SavedPublication { id, savedAt, data: PublicationItem }`
- localStorage key `honestcv.publicationLibrary`, max 30, newest first
- `sanitizePublicationItem`: all five keys always present (`asStr`); valid iff
  `title` OR `venue` OR `description` non-blank (date alone invalid)
- `listPublicationLibrary` / `savePublicationToLibrary` /
  `deleteLibraryPublication` with the standard malformed-row cleaning,
  swallowed storage exceptions, fresh nested `data.id` at save
- Builder Publications section: per-entry BookmarkPlus
  (`Save publication N to library`, disabled when title+venue+description all
  blank, green check 1.6 s), flex-wrap button row with `From library (n)`
  toggle hidden when empty, panel rows `title — venue` (fallback
  "Untitled publication") + saved date, Insert/Delete (h-10 mobile /
  sm:h-7 desktop), Insert appends `{ ...data, id: newId() }` and replaces a
  sole all-blank placeholder

## Non-goals

No schema/AI/scoring/export/Worker changes; no publication-type field.

## Validation

Local lint + tsc + build; deploy; production QA (save fidelity, guards,
insert semantics, malformed data, eleven-library regression, preview/PDF,
375px, zero AI, byte-for-byte localStorage restore).
