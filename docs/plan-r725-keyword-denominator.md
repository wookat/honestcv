# R725 — ATS keyword denominator: employer name, domains and boilerplate sections stop counting as keywords

## Evidence (first-hand, before any code)

Sample: the 84 production job descriptions captured during the R723 benchmark
(`/home/ubuntu/qa/r723-jds.json`, `/api/jobs/search` on cv.zalize.com, 8 queries),
scored with the shipped `extractKeywords` (`/home/ubuntu/qa/r725-baseline.mts` → `r725-before.json`).

| measure (84 JDs) | before |
| --- | --- |
| employer name is keyword #1 | 26 |
| employer name in top 3 | 45 |
| employer name anywhere in pool | 69 |
| boilerplate words in top 15 (avg; `please notice sponsorship visa privacy like real together one come believe hours …`) | 1.18 |
| curated hard skills in top 15 (avg) | 0.36 |

Examples of the shipped pool (first 15 of 30):

```
Perk    | perk travel platform product event social media real engineering like together events design lead senior technical
ClickUp | clickup ai please machine learning user experience javascript angular notice clickup.com product redux typescript rxjs accessibility privacy
Phantom | phantom markets open data react typescript web3.js ethers.js materials stripe products platforms technologies equity supportive
Spotify | spotify rights support user experience content product platform frontend engineers …
```

Why: the extractor keeps every non-stopword that occurs ≥2 times. The employer's
name is the most repeated word in most ads ("At Perk, we…", "Senior engineers at
Perk are…"), and "About us" / "How we work" / "Benefits" / "Protect yourself from
recruitment scams" sections repeat their own vocabulary (`real`, `together`,
`believe`, `please`, `notice`, `sponsorship`). A resume never legitimately "matches"
the employer's own name or its recruiting boilerplate, so each such keyword lowers the
score of an otherwise well-matched resume and pads the "missing" list with noise
(Perk's list started `perk … real … like together`).

Structure probe (`/home/ubuntu/qa/r725-probe.mts`): the ad itself introduces its
employer name in 51/84 JDs ("About Acme", "At Acme, we", "Acme is a…", "Join Acme"),
and 64/84 have at least one boilerplate heading.

## Design

`src/lib/ats.ts`, `extractKeywords(jd, limit = 30, company?)`:

1. **Employer tokens** are never keywords. Sources: the `company` argument (jobs board
   row `company`, resume `targetCompany`) split into words and dotted parts
   (`Headway.co` → `headway.co`, `headway`); plus the name the ad introduces itself,
   via four patterns (`About X` heading, `At X,`, `^X is a|an|the|on a mission|…`,
   `Join|Life at|Working at|Why X`). An inferred name is discarded if any of its words
   is a stopword or a generic noun (`us`, `team`, `role`…), and an inferred word that is
   a known skill is never dropped (an ad opening "React is a…" would not lose `react`).
   Tokens containing an employer word as a dotted/hyphenated part (`clickup.com`) go too.
2. **Domain tokens** (`www.x`, `*.com|co|io|org|ai|de|uk|…`) are dropped unless they
   are curated skills (`.net`, `next.js`, `node.js` are unaffected: not in that TLD list).
3. **Section-aware counting** — `splitBoilerplate()` walks the ad line by line; a short
   heading-shaped line (≤60 chars, ≤6 words, not a bullet, no sentence punctuation)
   matching the boilerplate heading list (`About us`, `Who we are`, `Our mission/values/
   culture`, `How we work`, `What we offer`, `Benefits`, `Perks`, `Compensation`,
   `Equal opportunity…`, `Diversity…`, `How to apply`, `Hiring/Interview process`,
   `…recruitment scams…`, `Life at …`, `Why …`, …) opens a boilerplate run that ends at the
   next heading-shaped line. `About the role/job/position/team` and `About you` are
   explicitly *not* boilerplate. Ordinary words are counted only in the job text;
   curated skills are still counted wherever they appear (Vercel's "About us" names
   Next.js). Nothing is split off when the remaining job text is under 40 tokens
   (short ads keep R709 behaviour).
4. **Stopwords** gain a small set of pure function words seen at the top of production
   pools and never a resume keyword: `like one come get sure real together please notice
   believe think keep without rather something way ways everyone actually even less see
   hear stay feel life hours time part every world around possible future outside meet
   e.g i.e u.s sponsorship visa`.

Callers pass the employer where they have it: `scoreResume` (builder / dashboard
health, `resume.targetCompany`), `matchScore` and `matchReport` (jobs board rows and
Tailoring report, `job.company`; builder / AssistantPanel `resume.targetCompany`),
`localInterviewQuestions`. `/ats-checker` (pasted JD, no company field) relies on
inference only.

Unchanged: `tokenize`, `KNOWN_SKILLS`, `KNOWN_PHRASES`, the ≥2-mentions core rule, the
15-keyword floor and requirements-block boost (R709), stemming/aliases (R710), the
`extractKeywords` return shape and every downstream signature (new arg is optional).

## Verification

`/home/ubuntu/qa/r725-measure.mts` (copied into the repo `qa/` dir, untracked, and run with `npx tsx --tsconfig tsconfig.app.json qa/r725-measure.mts`),
same 84 JDs:

| measure | before | after, company known | after, pasted (inferred only) |
| --- | --- | --- | --- |
| employer #1 | 26 | 0 | 5 |
| employer in top 3 | 45 | 0 | 10 |
| employer anywhere | 69 | 1 (`VML` — feed company string is `Vmlenterprisesolutions`) | 25 |
| boilerplate words in top 15 (avg) | 1.18 | 0.39 | 0.39 |
| curated skills in top 15 (avg) | 0.36 | 0.57 | 0.56 |
| avg pool size | 29.6 | 29.0 | 29.1 |
| curated skill tokens present before, missing after | — | 0 | — |

```
Perk    after: event social media product platform engineering travel events design lead senior technical complex support broader teams
ClickUp after: ai machine learning user experience javascript angular product redux typescript rxjs accessibility privacy data process teammates modern
PerfectServe after: product customers ai care clinical systems collaboration python llm aws leading million+ communications klas observability
```

Regression fixtures: `/home/ubuntu/qa/r709-probe.mts` (5 short ads + R708 golden JD 88 % / graphql,
next.js missing) and `/home/ubuntu/qa/r715-probe.mts` produce byte-identical output before and after.

Local gates: `tsc -p tsconfig.json`, `tsc -p worker/tsconfig.json`, eslint on the five
changed files (only the pre-existing exhaustive-deps warnings), `npm run build`,
`npm run verify-dist` — all green. Prettier `--check` warnings on the four touched app
files pre-exist unchanged.

Production: see `docs/handoff-context.md` R725 entry.

## Honest limits

- Employer inference is four English patterns on capitalised names; ads that never
  introduce their employer (or only in lowercase) keep the name when no `company` is
  passed (25/84 when pasted into /ats-checker vs 1/84 on the jobs board / builder).
- Explicit `company` words are dropped even when they are ordinary words
  ("Bayesian Health" drops `health`, "Creative Force" drops `creative`). On the sample
  this cost no curated skill; a resume matching the employer's own name was never a
  real signal, but a domain word shared with the requirements may be lost.
- Boilerplate headings are a hand list; a "Benefits" section titled unusually is still
  counted, and an ad whose requirements live under an "About us"-titled section would
  lose their ordinary words (skills are still counted). The 40-token guard limits the
  damage on short ads.
- No labelled precision/recall set exists; the measures above are proxy counts on 84
  real ads plus the hand fixtures from R708–R715.
