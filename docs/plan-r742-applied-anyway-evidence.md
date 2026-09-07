# R742 — an AI draft applied "anyway" does not become resume evidence for the next draft

Chain: R741 (#959) → this PR.

## Evidence

R741's own limits section recorded it: the grounding checks run against the *live* resume,
so once a flagged proposal is applied, its borrowed words are "on the resume" for every later
check. In the R741 production replay (`qa/r741-verify.cjs`, 0 real AI calls) the summary
proposal was flagged `technical quality, shaping, multi-sided, platforms, why` + scope `owning`;
after **Replace anyway** on the flagged bullet (which carried `shaping`, `technical solution`),
the summary's list had silently dropped `shaping` and `platforms`. Nothing about the summary
had changed — the resume had just been taught the ad's words by the previous click.

Every "anyway" action has this shape: Suggest a bullet / Complete line (R739), rewrite picker
(R739), keyword drafter (R740), Tailor accept (R712), Assistant summary / bullet (R741).
Each was built so the user reviews before anything is written; none of them told the next
check that what was written had been reviewed *with a note*, not verified.

The R736 cover-letter borrowing candidate was probed too (`qa/r742-probe.mts`, both retained
letters through `draftClaims` sentence by sentence): every first-person sentence that frames a
real bullet with the ad's purpose is caught (`Perk platform`, `shape experiences`, `aligns`,
`multi-sided`), but so are neutral words (`has`, `just`, `about`, `like`, `can help`) — a
sentence-level `mirrored` on prose needs a stop-list and a different UI, and the letter does
not feed later checks. The laundering gap does, and it is fixed here first.

## Change

`src/lib/appliedAnyway.ts` (new, ~40 lines, no dependency):

- `recordAppliedAnyway(text)` — exact trimmed draft text, deduped, newest first, capped at 100,
  in `localStorage['honestcv.appliedAnyway']`.
- `evidenceText(resumeText)` — the plain resume text with every recorded draft removed where it
  still appears verbatim. Editing the applied line (so it no longer matches) makes it evidence
  again: the user has rewritten it in their own words.
- Storage errors fall back to the full resume (behaviour before this PR).

Call sites — record **only when the draft was flagged** and only inside the click handler:

| flow | record | check evidence |
| --- | --- | --- |
| Suggest / Complete line (Builder) | `draftFlags.has('suggest')` → the applied first line | `evidenceText(resumeToPlainText(shown))` |
| rewrite picker (Builder) | per candidate `flagged` → the candidate | same memo |
| keyword drafter (`KeywordBulletDialog`) | `flags.size > 0` → the added text | `evidenceText(resumeToPlainText(resume))` |
| Tailor (`TailorDialog.decide`) | `flags.has(id)` → `row.suggestion` | `evidenceText(resumeToPlainText(snapshot))` (memo moved above `decide` — React Compiler) |
| Assistant (`AssistantPanel.apply`) | `proposalFlags.has(index)` and string value → `action.value` | `evidenceText(resumeText)` and `own` mapped through `evidenceText` |

The visible resume is untouched — the user's choice stands. Only what later grounding checks
treat as "already on your resume" changes. Clean drafts (no note) are never recorded: the user
applied text the check found supported, and it should count.

## Verification

- tsc app + worker, eslint (0 errors; pre-existing `exhaustive-deps` warning), build,
  verify-dist: green. `npm run build`'s project build caught `string | string[]` on the
  Assistant `skills` action (the standalone `tsc -p tsconfig.json` did not) → narrowed.
- `qa/r742-verify.cjs` = R741's replay + step 5b/5c/5d (0 real AI calls). Local `wrangler dev`
  then production `index-BBDkW0np.js`, 1280 + 375:
  - after **Replace anyway** the summary's list still has all six: `technical quality, shaping,
    multi-sided, platforms, why` + `owning` (R741 lost two);
  - `honestcv.appliedAnyway` = exactly `[<the flagged bullet>]`;
  - **Add bullet** on the clean card records nothing;
  - bullet 0 replaced, other bullets + summary byte-identical, 0 overflow, 0 console errors,
    storage back to baseline.
- Deploy: assets + Worker uploaded and live at first deploy; Workers Routes `code 10000` as
  always (token lacks `workers/routes`; not bypassed).

## Limits

- Exact-match only: an applied draft the user later edits by one character becomes evidence
  again in full. That is intended (ownership by rewriting) but it also means a cosmetic edit
  clears the record.
- Per-browser (`localStorage`), not per resume or per copy; a record from one resume affects
  another only if the identical line appears there.
- Still lexical and advisory: this stops one flagged phrase from vouching for the next; it
  cannot tell whether the user actually did the work.
- Cover-letter borrowing (R736 candidate) is measured, not fixed — noisy at sentence level;
  next round's candidate with a prose stop-list.
