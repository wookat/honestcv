# R740 — "Draft a bullet for <keyword>" gets the R739 post-check (the last AI route into the resume without one)

## Evidence (first-hand, production, 2 real calls)

`qa/r740-evidence.cjs` seeds the R733 Northstar resume + Perk ad, opens the builder and clicks the missing-keyword
chip's "Draft a bullet using …" for the first two keywords the panel lists (`technical`, `events`), then "Draft the
bullet". Both `/api/ai/keyword-bullet` calls returned 200 (5.3 s / 4.5 s, freeRemaining 4→3→2, 0 console errors):

| keyword | model reply | what the resume actually says |
|---|---|---|
| `technical` | *Owned technical quality across the React and TypeScript checkout redesign, proactively managing technical debt and reducing median page load time from 3.2 seconds to 1.8 seconds* | resume: "Led a React and TypeScript checkout redesign … 3.2 s → 1.8 s". `Owned` is not on the resume; `technical quality`, `proactively`, `technical debt` are the Perk ad's words (resume never) |
| `events` | *Led frontend development for an events booking experience in React and TypeScript, coordinating with [team size] designers and backend engineers to ship attendee coordination features for [add number] corporate clients* | the resume has no events / booking / attendee / corporate work at all — this is Perk's own product described as Northstar experience, with placeholders for the numbers |

The dialog says "grounded in your existing resume — … Only use it if the experience is genuinely yours" and shows the
draft with a plain **Add bullet** button; nothing is marked. 2/2 drafts borrowed the ad's duties, the same failure
R738 measured on "Suggest a bullet" (2/2) — and this route is reached from the ATS panel's *Missing keywords* chips,
the Tailoring report's *Still missing* pills (R715) and the "Is this missing keyword relevant?" card, i.e. it is
the path a user takes precisely when the resume lacks the concept.

Replaying both replies through R739's `draftClaims(draft, resumeText, jd, [keyword])` (`qa/r740-probe.mts`):

```
technical → mirrored ["technical quality","proactively managing","technical debt"], scope ["Owned"]
events    → mirrored ["booking","coordinating","attendee","corporate"]
```

With the keyword itself passed as `own` the check stays quiet about the one word the user asked for and names
only what came in beside it. Nothing else in the checker needs to change.

## Design (as-if-no-objection, executed)

1. `KeywordBulletDialog` (`src/pages/Builder.tsx`) computes
   `draftClaims(text, resumeToPlainText(resume), resume.jobDescription, [keyword])` for the current textarea value
   (recomputed as the user edits) and renders the shared `DraftFlagList` under the textarea
   (`aria-describedby`, amber border), exactly as R739 does for "Suggest a bullet".
2. The description says what was checked: after a draft, either "Marked below: what it says beyond “{keyword}”
   that your resume never states" or "Checked word by word against your resume — apart from “{keyword}”, nothing
   flagged". Before the draft exists the copy already says the draft is a suggestion to confirm.
3. **Add bullet** becomes **Add anyway** while anything is flagged. Nothing is blocked, nothing is written to the
   resume before the click; the user still picks the entry to add to.
4. `worker/prompts.ts` `buildKeywordBulletMessages`: the same framing R739 gave the suggest prompt — the ad's duties
   and product are not the candidate's history; work the keyword into what the resume shows the candidate did;
   where the resume shows nothing it can attach to, say so in a bracketed placeholder instead of adopting the ad's
   product ("[project where you used <keyword>]"). Signature unchanged.

Not done: no semantic gate (a borrowed duty written entirely in resume vocabulary still passes — the check is
word-level and advisory, as documented in R739); no change to `draftClaims`.

## Verification gates

- `npx tsc --noEmit -p tsconfig.json` · `npx tsc --noEmit -p worker/tsconfig.json`
- `npx eslint src/pages/Builder.tsx worker/prompts.ts`
- `npm run build` · `node scripts/verify-dist.mjs`
- `npm run deploy` (full chain), then production replay `qa/r740-verify.cjs` (route-mocked with the two retained
  replies, 0 real calls) at 1280 and 375: flags rendered per draft, "Add anyway", edit-to-resume-facts clears the
  flags and the button reads "Add bullet", bullet count +1 only after the click, storage back to baseline,
  0 console errors, no horizontal overflow.
- One real post-deploy call with the revised prompt (`qa/r740-prompt-sample.cjs`) recorded in this doc.
