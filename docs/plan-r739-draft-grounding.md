# R739 — per-entry AI bullet drafts get a grounding post-check (R738 P1)

R738 found the one route into the resume that no deterministic check covered: the builder's per-entry buttons — "Suggest a bullet" / "…with key numbers" (`bulletSuggest` dialog), "Complete line", and "AI rewrite bullets" / summary variants (`variantPick` picker). On production, 2/2 "Suggest a bullet" calls returned a duty from the Perk job ad ("Authored technical design documents for a multi-sided booking experience…") as Northstar Digital experience, under a dialog that only said "Review the draft" and a picker that asserted "Three honest takes on your text — nothing invented" unconditionally.

## What changed

### `src/lib/grounding.ts` — `draftClaims(draft, resumeText, jobDescription, own = [])`

Tailor's `tailorClaims` compares one rewrite against its original line, so any job-ad word the resume never uses is a fair signal. A suggested bullet has no original line — every word is new — so the same rule lists generic verbs (`using`, `building`, `Supported`, `aligning`, `teams`). The draft-level check keeps the R712 `figures` / `terms` logic (`unsupportedClaims`, ATS-variant aware since R737) and replaces `mirrored` with two narrower signals plus a new one:

- **`mirrored` phrases** — two adjacent content words (clause-local: never across `, ; : . ( ) —` or a line break) that the job ad uses together and the resume never does: `design documents`, `multi-sided booking`. A pair built from words of the line being rewritten plus the candidate's own vocabulary ("customer reporting" → "customer-facing analytics") is rewording, not borrowing. Hyphenated words count as own when a part is own (`customer-facing` ← `customer`); `multi-sided` is nobody's.
- **`mirrored` single words** — only when the ad is specific about them: hyphenated, capitalised mid-sentence, a technology name (`looksLikeSkill`, now exported from `ats.ts`), or a theme the ad repeats (≥ 2 mentions: `booking`). Words in `GENERIC_AD_WORDS` (team, platform, build, deliver, support, using …) and function words never qualify.
- **`scope`** — remit verbs (`own lead spearhead architect direct head manage drive pioneer oversee orchestrate champion found establish`, irregular pasts mapped) the resume never uses in any form: "leading code reviews" from "reviewing code", "Owned" from "Built".

`tailorClaims` and its return shape are unchanged (R712 fixture identical).

### `src/pages/Builder.tsx`

- `draftFlags` memo runs `draftClaims` per open draft: the suggest text (with the user's fragment as `own` in Complete-line mode, so finishing "Reviewed code for…" is not charged for "code reviews") and each picker candidate (with the original line as `own`). Recomputed on every edit of the suggest text.
- Shared `DraftFlagList` (the R712 amber list; Tailor now renders through it too) under the suggest textarea (`aria-describedby`) and under each flagged candidate (button `aria-describedby`, amber border, "· check before using" in the option label).
- Copy is conditional and never claims proof: picker → "Options marked below use figures, names, job-ad wording or a remit your resume never states — check those before picking one; picking applies it as written." vs "…checked word by word against your resume — nothing flagged."; suggest dialog → "A candidate bullet drafted from your resume [and the job ad]. It is a draft, not a record of what you did…" + "Marked below: what it says that your resume never states." / "…nothing flagged."
- Flagged application is explicit: **Apply anyway** / **Replace line anyway** instead of *Apply to entry* / *Replace line*. Nothing is blocked and nothing is written to the resume without the click — review-before-apply is preserved, not tightened into a gate.

### `worker/prompts.ts` — `buildSuggestBulletMessages`

R738 noted the contradiction "describe a typical, checkable achievement for that kind of role" + "ground only in the resume". The suggest branch now asks for a *candidate* the user will confirm or reject: prefer work the resume already evidences for this or nearby entries; anything the resume does not show (deliverable, audience, scope, metric) goes in a bracketed placeholder instead of being asserted; a job-description duty may only appear as a placeholder-marked candidate ("its duties are not the user's history"). Complete-line keeps the fragment-first rule. Key-numbers placeholder rule unchanged.

## Evidence (`qa/r739-probe.mts`, zero AI calls, replaying kept production outputs)

| Fixture | Line | `draftClaims` | old `tailorClaims.mirrored` |
|---|---|---|---|
| R738 suggest key-numbers | Authored technical design documents for a multi-sided booking experience across [number] internal teams… | mirrored `design documents, multi-sided, booking` | `technical, multi-sided, booking, internal, teams, aligning` |
| R738 suggest plain | Authored frontend design documents for [project name], aligning product, design, and backend teams on a multi-sided experience… | mirrored `design documents, multi-sided` | `aligning, teams, multi-sided, spanning` |
| R738 rewrite plain ×9 | faithful paraphrases | all clean | `Built`, `updates`, `using` |
| R738 rewrite key-numbers ×9 | "…by leading code reviews…" / "…by architecting React…" / "Maintained technical quality…" | scope `leading` / scope `architecting` / mirrored `technical quality`; other 6 clean | `building`, `platform`, `using`, `Supported`, `applying`, `technical`, `quality`, `leading`, `architecting` |
| R712 Tailor (5 lines) | "shipping production React…" / "cut page load latency by 44%" / "Owned the product design system" | mirrored `shipping production` / figures `44%` / scope `Owned`; 2 clean | `shipping, latency, conversion` / `cut, latency` / `Owned` |
| R726 Tailor (4) | | all clean | `team, ship` |
| R727 Tailor (3) | "Owned a React and TypeScript checkout redesign…" | scope `Owned`; 2 clean | `Owned`, `team, ship` |
| R703 golden truthful rewrite | "Developed customer-facing analytics dashboards in React…" from "Developed customer reporting dashboards…" | **clean** (was `customer-facing analytics` before the hyphen-part rule) | — |
| No job description | "Migrated 40 services to Kubernetes, cutting infra spend by 22%." | figures `40, 22%`, mirrored `[]` | — |

Lost vs the old rule: `conversion` on R712 line 1 (single JD mention, not hyphenated / capitalised / skill) — the same line is still flagged via `shipping production`. `technical quality` on one R738 rewrite is a real JD phrase added to a collaboration bullet; kept as advisory.

## Limits (as before, stated in the UI)

Word-level, English, advisory: it cannot prove a draft true or false, an invented duty written in resume words passes, and "nothing flagged" is not a guarantee. The scope list and `GENERIC_AD_WORDS` are hand-curated; no labelled precision/recall set (the fixtures above are the 22 + 12 + 2 kept production lines). The prompt change is prompt-level only until a later production sample.

## Gates

tsc app + worker, eslint (changed files; pre-existing `exhaustive-deps` warning only), `npm run build`, `node scripts/verify-dist.mjs` — green. Prettier `--check` on `grounding.ts` / `prompts.ts` reports pre-existing formatting only (same on base).
