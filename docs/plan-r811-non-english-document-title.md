# R811 — a document title in a product language ("Lebenslauf", "Currículum Vitae", "Hoja de Vida", "Currículo", "Persönliche Daten" …) is neither the name nor the title

## Source

Boundary recorded in R805 and queued through R810: R805 taught the name scan
to skip an English document title printed over the name (`CURRICULUM VITAE`,
`CV`, `Résumé`, `Personal Details / Information`), but the list was
English-only. The product exports and imports section headings and dates in
ES / FR / DE / PT since R789–R791, so a German / Spanish / French / Portuguese
CV pasted into the Builder or `/ats-checker` is a supported input — yet its
title line (`Lebenslauf` is printed on most German CVs; `Currículum Vitae` /
`Hoja de Vida` / `Currículo` are the common Spanish / Latin-American /
Portuguese ones; `Persönliche Daten` / `Datos personales` / `Coordonnées` open
the personal-data block) was stored as `fullName`, and the real name below it
was stored as the professional title. Builder name box, every template, share
title, TXT / MD header and letter sign-off printed "Lebenslauf".

## Evidence

- `qa/r811-evidence.mts` — 186 retained texts (R776 text replay + R786 PDF
  extractions), first 8 non-empty lines: **0** document-title lines of any
  language, **0** files whose opening lines carry an accented letter. The
  corpus is English-only, so the defect and the regression proof are
  synthetic (`qa/r811-probe.mts`, shapes A–I).
- Before (frozen R810 parser, `/home/ubuntu/qa/r811-wt` = `4086c8d`):
  ```
  D_lebenslauf   name="Lebenslauf"        title="Jane Doe"
  E_cv_fr        name="Curriculum Vitæ"   title="Jane Doe"
  F_hoja_de_vida name="Hoja de Vida"      title="Jane Doe"
  G_curriculo_pt name="Currículo"         title="Jane Doe"
  H_cv_es        name="Currículum Vitae"  title="Jane Doe"
  ```
- After:
  ```
  D–H  name="Jane Doe"  title=""  email kept, experience unchanged
  ```
- Bare-city probes (A `New York | phone | e-mail` with no name line → name
  `New York`; I `Jane Doe / New York / e-mail` → title `New York`) reproduce
  the other queued boundary; B `Austin, TX | …` is already location-only
  (R803 `isExpPlaceLine`). Not fixed this round — see Rejected.

## Fix (`src/lib/importText.ts`, one constant)

```ts
const DOC_TITLE_RE =
  /^(?:curr[ií]cul[ou]m?(?:\s+vit[aæ]e?)?|cv|r[ée]sum[ée]|lebenslauf|hoja\s+de\s+vida
     |personal\s+(?:details|information)|pers[öo]nliche\s+(?:daten|angaben)|angaben\s+zur\s+person
     |datos\s+personales|informaci[óo]n\s+personal|dados\s+pessoais|informa[çc][õo]es\s+pessoais
     |coordonn[ée]es|informations\s+personnelles|[ée]tat\s+civil)\s*:?$/iu
```

- Same two call sites as R805 (name scan skips the line while no name is
  found; the pre-heading default branch drops it instead of storing a title),
  so the behaviour for every recognised title is identical to `Curriculum
  Vitae` today. Whole-line match, optional trailing colon, any case, `u` flag
  so `/i` folds accented capitals (`PERSÖNLICHE DATEN`, `ÉTAT CIVIL`).
- Vocabulary is limited to the four product languages the importer already
  reads headings and dates in (ES / FR / DE / PT) plus the Latin
  `Curriculum Vitæ` ligature spelling. `curr[ií]cul[ou]m?` covers
  `curriculum` / `currículum` / `currículo` / `curriculo`; the vitae tail is
  optional so `Currículum` alone (Spanish) and `Currículo` (Portuguese) match,
  while `Curriculum Design` / `Curriculum Developer` do not (whole-line).

## Rejected

- A bare-city gazetteer for `New York | phone | e-mail` (probe A / I) —
  rejected again as in R806: with no name line, a two-word capitalised first
  segment in a contact row is exactly the shape a real name takes
  (`Jane Doe | jane@… | 555…`, R806 shape), so only a city list could tell
  them apart; the corpus has 0 instances, the jobs board's city list lives in
  the Worker, and names such as `Paris`, `Austin`, `Jordan`, `Chelsea` make a
  client-side list a false-negative risk on real names. Stays a recorded
  boundary; `City, ST` / `City, Country` already read as location.
- Matching any line that contains a title word (`/lebenslauf/i` unanchored) —
  `Vida Lebens` is a name, `Lebenslauf von Jane Doe` would still be dropped
  only as a whole line (not matched; stays a boundary).
- Pulling the list from `SECTION_LABELS_I18N` — those are section headings
  (`Profil`, `Berufserfahrung`), already handled by `matchHeading`, not
  document titles.

## Old / new proof

- `tests/import/rules.test.ts` +1 (R811): 18 title spellings (DE / ES / FR /
  PT, accent / case / colon variants) over `Jane Doe / Senior Engineer /
  contact` → name `Jane Doe`, title `Senior Engineer`, e-mail kept; control
  `Vida Lebens` stays the name; `Lebenslauf` over a nameless paste → name and
  title empty, e-mail kept.
- Frozen R810 checkout: the test fails
  (`Lebenslauf: expected { name: 'Lebenslauf', …} to deeply equal { name: 'Jane Doe', …}`).
- Replay 186 retained texts vs frozen R810 parser (`qa/r811-replay.mts`):
  **identical 186/186; changed 0**.
- Gates: `npm test` 242 / 242 (241 → 242), `tsc -p tsconfig.app.json`,
  `tsc -b`, eslint 0 errors (11 pre-existing warnings in untouched files),
  `npm run build`, `verify-dist`.

## Deploy + production QA

- `npm run build && node scripts/verify-dist.mjs && npx wrangler deploy`:
  30 / 30 modified assets + worker uploaded; route listing still fails with
  Cloudflare `code: 10000` (token lacks route-list permission; upload itself
  succeeded, not redeployed for it). Production `index-vcKNpl4n.js`,
  `importText-BJvOomKZ.js`, `Builder-4BFiE2EV.js`, `AtsChecker-C7B-r3-y.js`
  SHA-256 = local dist.
- Production QA (persistent testing agent, 1280 + independent 375, cache off,
  recording 5m55s 2× `/home/ubuntu/qa/r811/r811-production-readable-2x.mp4`,
  raw `/home/ubuntu/qa/r811/results.json`): A `Lebenslauf`, B `PERSÖNLICHE
  DATEN:`, C `Currículum Vitae`, D `Hoja de Vida`, E `Currículo`, E2
  `Coordonnées` through Builder Import paste and `/ats-checker` paste →
  Replace → name `Jane Doe`, title `Senior Engineer`, e-mail + phone kept,
  exactly one `Engineer / Acme / 2020 / 2021` job with its bullet; the title
  word is absent from the complete stored JSON, the real inputs and the
  preview, which prints the name once and the title once. F nameless
  `Lebenslauf` → `#c-fullName` / `#c-title` empty + placeholder shown, e-mail
  kept, one job (the editable preview's `Your Name` is a placeholder, not
  storage). G controls: `Vida Lebens` stays the name; English `Curriculum
  Vitae` (R805) and the plain `Jane Doe / Senior Engineer` header unchanged.
  Both paths equal after id removal + the known `ignoredKeywords: []`
  normalisation; real form values match. A / F at 375 = 375 / scale 1 /
  scrollX 0, no horizontal overflow in Edit or Preview. Regressions Sumit
  82/22 4/1/4 `Technical Writing`, Oxford 82/22 7/2/0, Alex 95/22 2/1,
  Kenneth 55/22 22/5 — hashes, extracted text, parsed content and ATS tables
  identical to R810. 27 runtime-discovered JS assets SHA = dist before and
  after; `/pricing` and `/examples/examples.json` 200 and identical to dist.
  2,581 GET / 0 POST (74 quota reads), 0 console / page errors, 0 HTTP ≥ 400,
  0 AI / lead / share / pay / copy / delete / download. 51 byte-exact storage
  checkpoints + 4 final snapshots. Corrected run 881 / 0; the retained
  initial attempts add 592 / 12 — all 12 are the comparator expecting zero
  experience rows / no preview wrapper for the contact-only G1 / G3 controls
  (R810 and R811 both pad one blank editor row; oracle corrected, desktop
  coverage repeated). Not exercised in production: shared `/s/:id`,
  downloads / exports (unit-tested).

## Boundaries

- `Lebenslauf von Jane Doe` / `CV — Jane Doe` (title and name on one line)
  is not recognised; the line is read as before.
- Languages outside ES / FR / DE / PT (`Curriculum Vitae` in Italian is
  covered by the Latin form; `Levensloop`, `CV / Życiorys`, `履歴書` are not).
- Bare-city contact rows with no name line (`New York | …`) and a bare city
  under the name (`Jane Doe / New York`) keep their R806 reading (name /
  title) — recorded, not fixed.
