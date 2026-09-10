# R715 — Tailor hands still-missing keywords to the grounded bullet drafter (follow-up to R712 / R713)

## Why

R713 listed as P1: "Tailor suggestions ignore the job's missing keywords (60 % → 60 % on the R712 sample)" and sketched the fix as *pass `missingKeywords` into the tailor prompt*. Reading the prompt and the dialog before writing code says otherwise:

- `buildTailorMessages` deliberately tells the model to mirror JD wording **only where the fact is already in the item**. A keyword that is missing from every summary/bullet cannot be covered by that rule without the model inventing the fact — exactly what R712 caught it doing (`cut latency by 44%`, `Owned`). Feeding it the missing list would push it toward the flagged behaviour.
- The builder already has a grounded path for a missing keyword: `KeywordBulletDialog` (`/api/ai/keyword-bullet`) drafts **one** bullet, grounded in the whole resume text, with `[bracketed placeholders]` for anything the resume does not state, chooses the best-matching experience entry, and inserts nothing until the user clicks. It is reachable from the ATS panel's "Missing keywords" chips (✨) — but not from the Tailoring report, which is where the user is told "Still missing: next.js, graphql, …" and left with inert pills.

So the smallest safe change is a **bridge**, not a prompt change: the Tailoring report's "Still missing" pills become actions that open the keyword-bullet drafter for that keyword, with copy that explains why tailoring cannot cover them. Tailor's contract, prompt, grounding flags and bulk-accept guard are untouched.

## Evidence

- `qa/r712-tailor-1.json` (real production Tailor call): 5 rewrites, `graphql` / `next.js` never appear — consistent with the prompt, not a defect of it.
- Production before this round (`index-Bi9Ceaw9.js`, Alex Morgan + R712 JD): "Missing keywords" listed `ideally` (from "ideally with GraphQL") next to real skills; the report's pills had no handler; with target role `Python Developer` and a resume without Python, `python` was dropped from the JD keyword list because `withoutRoleTokens` removed every title word (probe `qa/r715-role.mts`: 67 % with two missing vs 57 % with three — the role setting *hid* the skill that mattered).

## Change

`src/pages/Builder.tsx`

- `TailorDialog` gets `onDraftKeyword(keyword)`. The report's "Still missing" pills (first 6) are buttons in a `RovingChipGroup` (✨ + keyword, `aria-label="Draft a bullet using <kw>"`, 32 px on small screens, `+N more in Missing keywords` when longer). Copy: *"Still missing — tailoring only rewords what your resume already says, so it can't cover these. If you genuinely have one, draft a bullet grounded in your experience:"*
- Guard: with unreviewed suggestions the click opens the existing "Discard tailoring suggestions?" dialog, extended with *"Accept or keep each one first to draft a bullet for “kw” without losing them."*; its destructive button reads **Discard and draft bullet** and only then hands over. "Keep reviewing" / Escape clears the pending intent.
- Builder: `onDraftKeyword` closes Tailor and, after the 250 ms dialog exit, sets `kwBulletFor` — the same `KeywordBulletDialog` the ATS panel uses (`resume={shown}`, so accepted rewrites are already in the grounding text). Nothing is generated until "Draft the bullet" is clicked.

`src/lib/ats.ts` (side findings from the same probes; R709 fixtures unchanged)

- Stop words: `ideally highly strongly closely actively effectively successfully independently proactively especially particularly primarily typically regularly currently previously additionally directly record track`.
- `withoutRoleTokens` keeps a title word when `looksLikeSkill(kw)` (curated `KNOWN_SKILLS` / `*.js` shape): "Python Developer" no longer hides `python`; "Senior Node & React Developer" still drops `senior`/`developer`.

## Verification

Local: `npx tsc --noEmit -p tsconfig.json`, `npx eslint src/lib/ats.ts src/pages/Builder.tsx` (one pre-existing `exhaustive-deps` warning at line 1584, untouched), `npm run build`, `npm run verify-dist` — green.

`npx tsx --tsconfig tsconfig.app.json qa/r709-probe.mts`: the five R709 short-JD fixtures and the golden JD (88 %, missing `graphql`, `next.js`, 18 keywords) are byte-identical to R709/R710.

Production (`index-C067c8zD.js`, `qa/r715-evidence.cjs 1280|375`, `qa/shots/r715-{1280,375}/*`; `POST /api/ai/tailor` replayed from the saved real response via route mock — no new AI generation):

| Check | 1280 | 375 |
|---|---|---|
| Missing keywords, golden JD, role "Senior Node & React Developer" | `next.js graphql observability datadog grafana cutting` (no `ideally`, `react` not dropped) | same |
| Missing keywords, Python JD, role "Python Developer", resume without Python | `python pytest` | same |
| Report pills | 6 buttons, roving tabindex `0,-1,-1,-1,-1,-1` | same, 32 px tall |
| Click pill with 5 pending | guard dialog: "…Accept or keep each one first to draft a bullet for “next.js” without losing them." → Keep reviewing → Tailor still open, "0 accepted · 5 to review · 3 need a closer look" | same |
| Accept the 2 unflagged + Keep original ×3 → click `next.js` | Tailor unmounted; "Draft a bullet for “next.js”" dialog open, focus on "Draft the bullet" | same |
| Overflow / console / AI traffic | page 0 px, dialog 0 px, 0 errors, `GET /api/ai/quota` ×3 + mocked tailor only; storage back to baseline | same |

Wrangler: 30 assets uploaded, Worker uploaded; route management still fails with authentication error code 10000 (unchanged since R6xx; the served bundle is the new one).

## Honest limits

- The drafter can still be asked for a keyword the user does not have — the copy asks for a genuine match and the draft uses placeholders, but there is no verification of the user's claim (Rezi has none either).
- `cutting` (from "record of cutting p95 latency") remains in the missing list: it is a verb, not boilerplate, and no general rule was found that removes it without touching real requirement words; `record`/`track` were added because they are boilerplate in "track record".
- Only the first 6 still-missing keywords are actionable in the report; the rest remain in the ATS panel's full list.
- One real Tailor sample (R712) reused; no new production AI generation this round (quota discipline).
