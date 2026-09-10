# R737 — grounding post-check accepts the wording variants the ATS matcher already accepts (Playwright E2E, UIs, PMs)

Carried from R736's limits ("`Playwright E2E, UIs` term note — token-level false positive"). Chain: #955 (R736) → this PR.

## Evidence

`unsupportedClaims()` (R711) decides whether a capitalised run in an interview brief / cover letter / Tailor suggestion appears in the resume or the job ad by *containment* of the run's alphanumeric key or its normalised text. It has no notion of inflection or alias, so ordinary rewording of a real bullet is reported as "Not in your resume or the job ad". Measured on the real outputs kept from earlier rounds (`qa/r737-probe.mts`, resume = sample "Alex Morgan", JD = Perk Senior Frontend Engineer):

| output | flagged terms before | resume actually says |
| --- | --- | --- |
| R736 production brief (`qa/r736-prod-1280.json`) | `Playwright E2E`, `UIs` | "Added 65 **Playwright end-to-end** tests…", "Built 24 reusable **UI** components…" |
| R723 production brief (`qa/r723-interview.txt`) | `PMs` | "Collaborates with designers and **product managers**…" |
| R705 brief (`qa/r705-brief-after.txt`) | `Node.js`, `Next.js`, `AWS`, `MTTR`, `Senior Node`, `Copilot`, `Cursor` | none of these — true positives (kept) |
| R733 brief / cover, R736 cover | — | — |

The user-visible effect: the brief's grounding box says "Grounded… / Not in your resume or the job ad: Playwright E2E, UIs — fine as a question or a suggestion, not as your experience." under a bullet the candidate wrote themselves; a cover letter that says "shipped accessible UIs alongside the PMs" turns the box amber ("Check against your resume before you rely on this") with three false terms. A check that cries wolf on the user's own wording trains them to ignore it when it is right.

## Change

`src/lib/ats.ts` (already the resume-vs-keyword matcher: surface token, Porter stem with UK/US folding, alias groups):

- alias groups gain `['end-to-end', 'end to end', 'e2e']` and `['product manager', 'pm']` — both were missing for the ATS score too (a JD "end-to-end testing" requirement vs. a resume "E2E tests" line was a miss);
- `keywordHit` also looks the alias group up by the keyword's stem (`ALIASES.get(kw) ?? ALIASES.get(stemToken(kw))`), so "kpis"/"llms"-style plurals no longer need to be listed one by one.

`src/lib/grounding.ts` — `supported()` gets a last resort after the existing containment / every-word rules: every word of the run must be either contained in a source or a `keywordHit` against an `indexResumeText()` of the joined sources (resume, job ad, highlights, company). Acronym plurals of 2–4 letters (`UIs`, `PMs`, `APIs`) are tried with and without the trailing `s`, because the ATS stemmer deliberately leaves tokens shorter than four letters alone. `unsupportedClaims` builds the index once per call; nothing else about the check (figures, `mirrored`, brief anchors) changes.

## Verification

Local (`npx tsx --tsconfig tsconfig.app.json qa/r737-probe.mts`, `/home/ubuntu/qa/r712-check2.mts`):

| case | before | after |
| --- | --- | --- |
| R736 production brief terms | `Playwright E2E`, `UIs` | `[]` |
| R723 production brief terms | `PMs` | `[]` |
| R705 brief terms | 7 (all true) | `Node.js`, `Next.js`, `AWS`, `MTTR`, `Senior Node`, `Copilot`, `Cursor` |
| invented sentence "…used Cypress, Flutter, Datadog and Storybooks; … Team Lead for the Dashboards squad … with PMs on E2E coverage" | 4 incl. `PMs` | `Cypress`, `Flutter`, `Datadog` |
| R712 Tailor fixture (5 suggestions) | 44 %, Owned, 3 mirrored | identical |
| R711 fixture before/after briefs | SSR / MTTR, Copilot, Cursor | identical |

Gates: tsc app + worker, eslint (grounding.ts, ats.ts), build, verify-dist — green (`/home/ubuntu/qa/r737-build.log`). Deployed `index-Cmsbwu6M.js` / `Builder-CuQ_7I2x.js`, live at first deploy (Routes `code 10000` listing error as before, upload unaffected).

Production, zero AI calls, 375 + 1280 (`/home/ubuntu/qa/r737-verify.cjs`, `qa/shots/r737/`): today's brief → "Grounded: all 8 … all 3 …" with **no** term note (was: `Playwright E2E, UIs`); R723 brief → same (was: `PMs`); same brief with `Cypress E2E` → note "Not in your resume or the job ad: Cypress E2E"; today's cover letter plus "I added Playwright E2E coverage … shipped accessible UIs alongside the PMs and designers" → no grounding box (was: amber, 3 terms); with `Cypress and Datadog` instead → "Check against your resume… Not in your resume or the job ad: Cypress, Datadog". 0 overflow, 0 console errors, 0 AI calls, storage back to baseline.

## Limits

- Still token-level: an invented duty phrased in resume words is not caught (unchanged since R711).
- The alias table is hand-curated (now 40 groups); a variant outside it and outside Porter stemming ("K8s" is listed, "Kube" is not) stays flagged.
- `pm` as an ATS alias means a JD keyword "product manager" is satisfied by a resume "PM" — intended, but one more place where two letters carry meaning.
- ATS-side effect of the two new alias groups is additive (a miss can become a hit, never the reverse); no labelled precision/recall set exists for it (same caveat as R710).
