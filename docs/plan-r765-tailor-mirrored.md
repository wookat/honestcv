# R765 — Tailor "wording from the job ad" flags phrases and remit verbs, not lone synonyms

## Evidence (retained production Tailor replies, zero AI calls)

Six real production Tailor runs are retained under `~/qa/` (R712 Northstar ad ×1, R726/R727 Perk ad ×4,
R753 Comand AI ad ×1) — 25 rewritten lines against the same Alex Morgan resume. Replayed through the
deployed `tailorClaims()` with `qa/r765-replay.mts` (not committed):

- 21 / 25 rows flagged; 51 `mirrored` words in total.
- Word histogram: `quality×5 owned×4 technical×4 team×4 boundaries×3 latency×2 shaping×2 architected×2
  front-end×2 patterns×2 shipping cut conversion platform leading area owns complex problem definition
  closely ambiguous clear dependable flows create coherent surfaces raised large datasets ship specialities`.

Each row was read against its original line and labelled (what the rewrite *claims* that the line and
resume do not):

| rows | label | what the rewrite added |
|---|---|---|
| 3, 10, 14, 21 | remit inflation | `Owned` / `Owns` for a line that says *Led* / *Built* |
| 11, 17 | remit inflation | `Architected`, `establishing patterns reused across …` |
| 8, 12, 15, 18 | ad phrase | `guarding … technical quality` (Perk: "guardian of your team's technical quality") |
| 9, 13, 16 | ad phrase | `leading across team boundaries` (Perk heading "Lead across boundaries") |
| 1 | ad claim | `latency reduction and conversion improvements` (Northstar: "cutting p95 latency … lifting conversion") — the resume never mentions conversion |
| 7 | ad purpose | `shaping consistent experiences across the platform` |
| 20 | ad summary | `Owns complex interfaces from problem definition … ambiguous needs into clear, dependable flows` |
| 22 | ad purpose | `create coherent patterns across surfaces` (Comand: "reusable patterns … more coherent … surface area") |
| 24 | ad scope | `on large datasets` |
| 2, 23 | mild — fact is in the line, wording is the ad's | `cut page load latency` (figure already flagged), `Raised front-end quality` |
| 4, 5, 6, 19, 25 | nothing | synonyms (`analytics`, `conducting … reviews`, `cross-functional`, `across specialities`) |

Of the 51 flagged words, 24 sit inside a labelled claim; 27 are lone synonyms the resume happens not to
use (`team`, `ship`, `cut`, `create`, `clear`, `closely`, `area`, `technical` on its own …). The signal the
user needs — *which words are the ad's* — was buried: row 9 showed `leading, team, boundaries` as three
unrelated words, row 20 showed ten.

The `draftClaims()` policy (R739–R741: adjacent ad bigrams, ad-specific single words, remit verbs) applied to
the same rows catches every remit verb and 4 of the 5 phrase labels, but misses `team boundaries` (the ad
says "across boundaries" — not adjacent) and `conversion` (once in the ad, lower-case, not a skill).

## Decision

Tailor has something drafts do not: the original line. A clause the rewrite *adds* is the unit —
two or more job-ad content words in one clause that neither the line nor the resume uses (in any
inflection, verb form or hyphen spelling) is borrowed wording, reported as the span it occupies
(`team boundaries`, `latency reduction and conversion`, `shaping consistent experiences across the
platform`). A lone ad word is reported only under the draft policy (ad-specific: hyphenated / capitalised
mid-sentence / known skill / repeated in the ad). Remit verbs surface as their own group ("Claims a remit
your resume never states"), as they already do under every draft dialog.

Not done: a generic-word denylist alone (would still show `boundaries` and `conversion` as isolated words
and hide nothing on row 20); a JD frequency threshold (`conversion` appears once and is the most
consequential claim in the set).

## Change (`src/lib/grounding.ts`, `src/pages/Builder.tsx`)

- `tailorClaims()` = `draftClaims(suggestion, resume, ad, [original])` + the added-clause rule; returns
  `scope` too. Figures / names / remeasured are unchanged (same inputs, same functions).
- `draftClaims()` own-word test now accepts a hyphenated spelling whose closed form the resume states
  (`front-end` vs `Frontend`) — the R753 hyphen fix reached `tailorClaims` but not the draft path.
- Builder Tailor dialog renders the shared `draftFlagGroups()` (adds the remit group).

## Result on the 25 retained rows

- Rows flagged 21 → 20 (row 2 stays flagged by its `44%` figure; rows 4, 5, 6, 19, 25 stay clean).
- `mirrored` items 51 words → 17 spans; every labelled claim above is shown as one span (`team boundaries`,
  `technical quality`, `latency reduction and conversion`, `create coherent patterns across surfaces`,
  `large datasets`, `Owns complex interfaces from problem definition`, …); remit verbs `Owned ×3 / Owns /
  Architected ×2 / establishing` move to the remit group. Three mild items remain (`shipping production`,
  `cut page load latency`, `Raised front-end quality`) — each is the ad's wording for a fact the line does
  state; advisory only.
- Draft / letter / brief / practice probes (R739, R740, R741, R742, R744, R745, R749, R750 fixtures)
  byte-identical apart from the new `scope` field on the tailor object.

## Boundaries

- English, word-level; a clause built from the resume's own vocabulary passes.
- A borrowed *single* generic ad word inside an otherwise own clause is no longer shown (by design).
- 25 rows from one resume and three ads; no labelled set beyond this file.
