# R766 — the 30-keyword cap measured once more (no change); seniority grade words leave the keyword list

Chain: R765 (#983) → this PR. Corpus (`qa/r751-rows.json`, 84 real ads) + 12 fresh production ads (`r758-oos.json`), gold labels (`qa/r752-labels.mts`, 247 STRICT terms), 16 dev / 8 held-out split and the R752 category definitions are unchanged.

## Question 1 — does raising the cap, or a category-aware ranking, recover the requirement names the cap cuts?

R756 / R759 left seven strict gold terms outside the top-30 on five labelled ads: Spotify `accessible` (rank 32), Sporty Group `backend` (34), Reddit `rag` (38) `targeting` (40), Jedox `english` (32), Think Academy `young` (32) `learners` (34). All lower-case words the ad says twice.

### Cap alone (`qa/r766-limit.mts`, fixed gold, current ranking)

| limit | dev tp/fp/fn · F1 | held-out tp/fp/fn · F1 | all F1 |
|---|---|---|---|
| **30** | 145/120/12 · 0.69 | 82/75/8 · 0.66 | 0.68 |
| 35 | 147/127/10 · 0.68 | 84/80/6 · 0.66 | 0.67 |
| 40 | 147/130/10 · 0.68 | 86/91/4 · 0.64 | 0.66 |
| 50 | 147/131/10 · 0.68 | 86/92/4 · 0.64 | 0.66 |

Every five extra slots buy 1–2 gold terms and 5–8 false positives; held-out F1 falls. The cap stays at 30.

### Ranking by word class (`qa/r766-roles.mts`, `qa/r766-product.mts`, `qa/r766-senior.mts`, 96 ads)

For each class, the words a promotion rule would move up, and what the gold says about the ones already in the top-30:

| class | source shape | words | already top-30 | labelled R/T (requirement) | labelled G/E | unlabelled |
|---|---|---|---|---|---|---|
| role-title words | Title-Case run ending in a role noun (`Machine Learning Engineer`) | 54 | 45 | 11 | 2 | 32 |
| employer / product names | employer + Title-Case run (`Spotify Rights Center`, `Reddit Ads`) | 131 | 28 | 2 | 4 | 22 |
| seniority grade | `senior junior principal staff lead …` in the title | 31 | 31 | 1 (`lead`, Sporty "Team Lead") | 3 | 27 |

None of the three classes is a requirement more often than not; a rule that lifts any of them past the cap would import more G/E than R. The seven cut terms belong to no shape that separates them from the 195 in-cap false positives (they are lower-case, said twice, in the block — like the false positives). **No ranking change.** The cap-cut terms are recorded as a known limit of the 30-keyword list.

## Question 2 — the one class the table does condemn

`senior` sits in the top-30 of 18 of 96 real ads and is *High priority* in 11 of them — every time because the ad's title line ("Senior Product Designer") or its requirements block ("5+ years as a senior …") says it. The three labelled occurrences are all G. The builder already treats the user's own target-title words as "noise as resume keywords, not skills" (`withoutRoleTokens`); `/ats-checker` has no title field and the builder drops them only when the user's title happens to contain the word. A grade is not something a résumé should be told to "add".

Fix (one line, `STOPWORDS`): `senior junior principal sr jr seasoned mid-level entry-level`. `staff` and `experienced` were already stopwords; `lead` / `head` / `associate` stay (`Team Lead`, `Head of Sales`, `Associate Professor` are role nouns and sometimes the requirement itself; the corpus shows `lead` labelled T once).

### Measured (`qa/r766-snap.mts`, before/after on 96 ads)

- Fixed gold STRICT: tp 227 → 227, fp 195 → 194, fn 20 → 20 — F1 0.68 unchanged; dev / held-out unchanged to two decimals.
- 96 ads: 18 change, 18 words out (all `senior`), 13 words in at rank 30 (`growth rigor end-to-end figjam engineering workflow local seed/series forecasting success analysts roadmap graphic`); 5 ads shrink to 29 keywords. High 1897 → 1894.
- The other seven new stopwords match nothing in the 96 ads' current top-30 (`principal`, `junior` never reach the cap); they are there for symmetry with `senior`, not for a measured gain.

## Boundaries

- English grade words only; `staff` was already a stopword and `staff engineer` as a level is not detectable.
- The seven cap-cut gold terms remain outside the list; the evidence above says the fix is not in ranking. A per-ad longer list (user-expandable) would be a UI change, not a ranking one — queued, not done.
- Fixed gold gains one precision point only; this round's value is the 11 ads whose High-priority panel stops telling the candidate to write "senior".
