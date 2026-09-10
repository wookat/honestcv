# R741 — Resume Assistant summary / bullet proposals get the shared grounding post-check (the last AI route into the resume without one)

## Evidence (first-hand, production, 2 real calls)

`qa/r741-evidence.cjs` seeds the R733 Northstar resume + Perk ad, opens `/builder?assistant=1` and asks the
assistant two ordinary things. Both `/api/ai/assistant` calls returned 200 (0 console errors, storage cleared):

| prompt | model proposal | what the resume actually says |
|---|---|---|
| *Rewrite my professional summary for this job.* | "… Experienced in shaping product experiences across complex, **multi-sided platforms** — from checkout redesigns to design systems and performance work. Partners closely with product managers, designers, and engineers to define what to build and **why**, **owning technical quality** and delivery. …" | resume: built / led a checkout redesign, design system, performance work. `multi-sided`, `platforms`, `technical quality`, `why` are Perk's ad; `owning` upgrades the resume's verbs |
| *Strengthen my first bullet at Northstar Digital for this job.* | "Led a React and TypeScript checkout redesign across a complex customer-facing platform, cutting median page load time from 3.2s to 1.8s while **shaping the technical solution** end-to-end with product and design partners." | original: "Led a React and TypeScript checkout redesign that reduced median page load time from 3.2 seconds to 1.8 seconds." `shaping the technical solution` is the ad's phrase |

The panel rendered both as proposal cards with a plain **Apply to summary** / **Replace bullet** button and no
note. Facts survive (3.2 s → 1.8 s intact, no invented employer / tool), the borrowing is the same failure mode
R738–R740 measured on the per-entry routes: the ad's duties described as the user's history, verbs upgraded.
The assistant already keeps review-before-apply (`onApply` fires only on the button, `Builder.tsx` mutates
summary / bullet there) — the gap is that nothing tells the user *what* to review.

Replaying both proposals through R739's `draftClaims(draft, resumeText, jd, own)` (`qa/r741-probe.mts`, 0 AI calls),
with the current summary / the replaced bullet passed as `own`:

```
summary → mirrored ["technical quality","shaping","multi-sided","platforms","why"], scope ["owning"]
bullet  → mirrored ["technical solution","shaping"]
```

One false positive surfaced: the capitalised-word rule (R739: "capitalised mid-sentence = proper noun / skill")
flagged `Experienced` because it opens a sentence in the middle of the paragraph — the rule only exempted offset 0.
Fixed in `grounding.ts` (below); R739 / R740 probes byte-identical before and after.

## Design (as-if-no-objection, executed)

1. `src/components/DraftFlagList.tsx` — `DraftFlagGroup`, `draftFlagGroups()`, `DraftFlagList` moved out of
   `Builder.tsx` so `AssistantPanel` and `Builder` share one warning vocabulary and one rendering. No behaviour
   change for Tailor / Suggest / Complete line / picker / keyword drafter.
2. `AssistantPanel.tsx`: `proposalFlags` memo over `turns` — for every unapplied `summary` / `bullet` action,
   `draftFlagGroups(draftClaims(value, resumeToPlainText(resume), jobDescription, own))` with
   `own = [resume.summary]` for a summary and `[action.replace]` for a rewrite (nothing for an added bullet).
   Rendered under the proposal text as `DraftFlagList id="assistant-flags-{i}"`, wired to the button via
   `aria-describedby`. Button label becomes **Apply anyway** / **Replace anyway** / **Add anyway** while anything
   is flagged; clean proposals keep their labels. `skills` proposals unchanged (a skills list is the user's to
   pick; R741 evidence did not exercise it).
   Recomputed against the *live* resume: after a proposal is applied, later proposals are checked against the
   resume that now contains it (see Limits).
3. `grounding.ts`: sentence-start offsets (`^` or after `.!?;:` / newline / bullet marker) are no longer treated
   as "capitalised mid-sentence" evidence. Everything else in `draftClaims` unchanged.
4. `worker/prompts.ts` assistant system prompt: the JD is context for what the employer wants, not a record of
   the user's history — do not describe the employer's product / platform / responsibilities as the user's work,
   do not upgrade the resume's verbs (built → owned, contributed → led), do not borrow the ad's phrases the resume
   never uses. Request / response contract of `/api/ai/assistant` unchanged.

Not done: no semantic gate (a borrowed duty written entirely in resume vocabulary still passes; `mirrored` lists
legitimate synonyms next to real borrowing — advisory, word-level, English-only, as since R711); no gating of
Apply; no server-side second call.

## Verification

- `npx tsc --noEmit -p tsconfig.json` · `npx tsc --noEmit -p worker/tsconfig.json` green.
- `npx eslint src/components/AssistantPanel.tsx src/components/DraftFlagList.tsx src/lib/grounding.ts src/pages/Builder.tsx worker/prompts.ts`:
  0 errors; warnings = pre-existing `exhaustive-deps` (`jumpToSection`) in Builder + `react-refresh/only-export-components`
  on the new shared module (it exports helpers next to the component, same shape as other `src/components` helpers).
  A first cut computed `resumeText` unmemoised and the React Compiler refused to preserve the memo
  ("Existing memoization could not be preserved") — `useMemo` fixed it.
- `npm run build` · `node scripts/verify-dist.mjs` (123 sitemap URLs) green.
- Probes: `qa/r741-probe.mts` as above; `qa/r739-probe.mts` / `qa/r740-probe.mts` diff-empty before vs after the
  `grounding.ts` change.
- Local `wrangler dev` replay, then `npm run deploy`: assets + Worker uploaded (`index-CdasTMsb.js`), Workers Routes
  `Authentication error [code: 10000]` as every round (token lacks `workers/routes`; upload is live, not bypassed).
- Production replay `qa/r741-verify.cjs` at 1280 and 375 (route mock of `/api/ai/**` replaying the two retained
  production actions + one clean added bullet, **0 real AI calls**, `qa/shots/r741/`):
  - 3 proposal cards; card 1 → "Wording from the job ad …: technical quality, shaping, multi-sided, platforms, why ·
    Claims a remit …: owning" + **Apply anyway**; card 2 → "technical solution, shaping" + **Replace anyway**;
    card 3 → no list, **Add bullet**; each list is the button's `aria-describedby` target.
  - Resume storage identical before and after the cards rendered (nothing applied on arrival).
  - Click **Replace anyway** on card 2 → only bullet 0 of the Northstar entry changed to the proposal; other bullets
    and the summary byte-identical; card 2 shows applied state; card 1 still pending with **Apply anyway**.
  - `documentElement.scrollWidth − innerWidth = −15` at both widths (no horizontal overflow); 0 console / page
    errors; localStorage restored to baseline.

## Limits (say so in the UI copy and the handoff)

- Word-level lexical check; cannot prove the user has the experience. Invented duties written in resume words pass;
  legitimate synonyms are flagged beside real borrowing.
- Checks run against the live resume, so accepting one borrowed proposal launders its words for the next: after
  the bullet above was applied, the summary's list dropped `shaping` and `platforms` (now on the resume). This is
  the same rule every other route follows; a stricter "original resume" baseline would need a snapshot the
  assistant does not have.
- Prompt change has n = 0 post-deploy samples (quota discipline); the post-check is the guard, the prompt the nudge.
- `skills` proposals are unchecked by design this round.
