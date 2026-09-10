# R710 — ATS keyword matching accepts inflections, UK/US spellings and known aliases

Follow-up to R708 (single-mention hard skills kept) and R709 (short-ad noise). Both fixed
*extraction*; this round fixes *matching*, which was still exact-string.

## Evidence (local, `npx tsx --tsconfig tsconfig.app.json`, `qa/r710-jd.txt` × `qa/r710-fixture.json`)

A 70-word backend ad whose requirement list reads `Node.js, React.js, PostgreSQL, Kubernetes,
CI/CD, dashboards, analysing data, Javascript, Typescript, Google Cloud, machine learning,
A/B testing`, scored against a resume that states every one of them in ordinary resume wording
(`Node and React services, ran Postgres and K8s on Google Cloud Platform, continuous integration
and continuous delivery pipelines, one dashboard, analyzed funnels … ML, A/B tests`):

| | keyword score | covered | missing |
|---|---|---|---|
| before | **27** | `javascript typescript k8s google` | `machine learning, a/b testing, node.js, react.js, postgresql, kubernetes, ci/cd, gcp, dashboards, analysing, data` (10 of 11 flagged high priority) |
| after | **93** | 14 | `data` |

Every "missing" item except `data` was on the resume. Root causes, each verified by probe:

1. **Exact token equality.** `matchTokenSet(tokens).has(kw)` — `dashboards` ≠ `dashboard`,
   `analysing` ≠ `analyzed`. The only leniency was splitting `-`/`/` compounds (`ci/cd` → `ci`, `cd`).
2. **No alias knowledge.** `postgresql` ≠ `postgres`, `kubernetes` ≠ `k8s`, `node.js` ≠ `node`,
   `gcp` ≠ `google cloud`, `machine learning` ≠ `ml`, `a/b testing` ≠ `a/b tests`.
3. **Phrases matched by raw substring** (`resumeText.includes('a/b testing')`), so a phrase never
   matched an inflected form.

Rezi's Keyword Scanner (public product page) credits synonyms/variants; ours penalised the
candidate for writing the resume the way engineers actually write it.

## Design (`src/lib/ats.ts`; public signatures unchanged, `variants` added to results)

- `indexResumeText(text)` → `{ text, tokens, tokenSet, stems }`: tokens as before, plus a Porter
  stem per token (`stemmer` 2.0.1, published 2022 — the standard zero-dependency Porter
  implementation; no hand-rolled stemmer). Tokens with digits or symbols (`c++`, `k8s`, `ci/cd`,
  `html5`) are never stemmed. Before stemming, common UK suffixes fold to US
  (`-isation/-ising/-ised/-ise`, `-ysing/-ysed/-yse`, `-our` → `-or` (≥6 letters), `-mme(s)` → `-m(s)`)
  so `analysing`/`analyzed`, `optimised`/`optimization`, `programmes`/`programs`, `behaviour`/`behavior`
  share a stem.
- `keywordHit(kw, idx)` order: exact (token / compound part / phrase substring, i.e. the old
  behaviour) → stem match (single token: any resume token with the same stem; phrase: consecutive
  stems) → alias forms from a curated `ALIAS_GROUPS` list, each tried exact-then-stem. Returns
  `{ hit, found }` where `found` is the resume's wording when it differs from the JD's.
- `ALIAS_GROUPS` lists only forms that are unambiguous on a resume: `node`, `react`, `vue`,
  `angular`, `postgres`, `mongo`, `k8s`, `ml`, `nlp`, `ux/ui`, `qa`, `tdd`, `oop`, `iac`, `seo`, `crm`,
  `kpi(s)`, `saas`, `b2b`, `rn`, `icu`, `bls`, `acls`, `powerbi`, `csharp`, `cpp`, `dotnet`, cloud
  long/short names, CI/CD long forms, A/B testing variants. Deliberately **not** aliased: `go`,
  `express`, `excel`, `spring`, `rest` (ordinary words → false matches; same list R708 excluded from
  `KNOWN_SKILLS`).
- `matchScore`, `matchReport`, `scoreResumeText`, `scoreResume` all route through one
  `splitKeywords` / `keywordHit`; `MatchReport.variants` and `AtsResult.variants` expose
  `{ keyword, found }` pairs.
- UI (small): Builder "Matched" chips and the ATS checker's matched badges append `as "postgres"`
  when the resume words it differently, so the user can see *why* it counted; Builder's
  "Highlight in preview" paints the resume's wording (`found`) instead of the JD spelling, which
  would otherwise highlight nothing for variant hits.

## Guard-rails (probed)

- `golang` vs resume "I go to the office" → no hit; `express.js` vs "express ideas" → no hit;
  `microsoft excel` vs "excel at" → no hit (`excel` alone still hits exactly, as before).
- `hour` vs `hours`, `tour` vs `tours` → hit (inflection, intended); `honor` vs `hours` → no hit.
- R708 golden JD: 16 of 18, `graphql, next.js` missing, 0 variants — unchanged.
- R709 nurse ad: 77 %, `acls, therapy, medical/surgical` missing, 0 variants — unchanged.

## Limitations (honest)

- Porter stemming over-merges occasionally (`organizing` ↔ `organised` is intended; `hour` ↔ `hours`
  is intended; but e.g. `university` ↔ `universe` share a stem). No labelled precision/recall run —
  1 synthetic ad + 2 regression ads + 13 hand-picked pairs.
- Alias list is curated, not learned; niche tools still need the exact spelling.
- Stem/alias hits count fully (no partial credit) — same as Rezi's public behaviour, and simpler to
  explain than a weighted score.
- The ATS checker's "Keyword frequency" table counts occurrences of the resume's wording for a
  variant hit (floor 1), so a matched keyword is never shown as `✕`; occurrences of *other*
  variants of the same keyword are not added up.
