# R745 — a cover-letter sentence that describes the candidate's past work in the job ad's words is flagged ("Describes your past work in the job ad's words, which your resume never uses: “support specialists”, “suppliers”, “participants”")

## 1. Evidence

### Production (R736 QA, `qa/r736-prod-1280.json` — cover letter written after the R736 prompt change, Perk JD, Northstar resume)

> I also built 24 reusable UI components for our product design system using Storybook, documenting keyboard interactions so that **planners, support specialists, suppliers, and participants** could all navigate the interface accessibly.

The resume bullet says: `Built 24 reusable UI components for the design system using Storybook, with keyboard interactions documented.` Nothing about who used them. "Planners / support specialists / suppliers / participants" is Perk's user list from the job ad ("*a multi-sided platform used by event planners, support specialists, suppliers and participants*"). The letter attaches the employer's users to the candidate's past work as its purpose: a fact the candidate never stated, written in the ad's own words. `unsupportedClaims` (names / figures) and `preferenceClaims` (feelings) both pass it — the words are ordinary nouns, not names, and it is not a feeling.

The same letter contains legitimate role-fit prose that must **not** be flagged:

> …work that speaks to the accessible, multi-sided experience Perk is building.

Same ad words, but after a bridge ("work that speaks to …") the sentence is about the role, not about what the candidate did.

R742's probe (`qa/r742-probe.mts`) already quantified the sentence-level `mirrored` route: real borrowings caught, but plain function words (`has` / `just` / `about` / `like`) listed as job-ad wording. That is why it was parked as "needs a stop-list + its own UI".

### Historical replay (`qa/r745-probe.mts`, 0 AI calls)

| Letter | Result |
| --- | --- |
| R736-before (pre-R736 prompt, `qa/r736-cover.txt`) | none — its borrowings are feelings, already caught by `preferenceClaims` |
| R736-after (`qa/r736-prod-1280.json`) | 1 sentence: `support specialists`, `suppliers`, `participants` |
| R743 (`qa/r743-prod-1280.json`) | none |

Nine synthetic controls (borrowed duty; faithful React/TypeScript metric + "work that speaks to" bridge; em-dash bridge; present-tense stack fit; "I'm excited"; "owned technical quality for a multi-sided booking platform"; faithful release sentence; "shaped quarterly goals / long-term vision"; "experience relevant to …" bridge) 9/9 as intended. R744's `5-person team` regression sentence now returns `mirrored: []` (`person` added to the generic-ad list).

Rezi's public cover-letter page advertises "tailored to the job description" and nothing about separating the ad's facts from the candidate's; nothing observable to compare against.

## 2. Design

Lexical and advisory, like every check in `src/lib/grounding.ts`. It cannot know what the candidate did; it says which sentence uses which ad words for the candidate's own work and lets the user decide.

### `letterBorrowing(letter, resumeText, jobDescription, own = []): BorrowedSentence[]`

```ts
interface BorrowedSentence { sentence: string; words: string[] }
```

1. Split the letter into paragraphs, then sentence-like fragments (`[^.!?]+[.!?]+`).
2. Keep only sentences that state candidate activity: `PAST_CLAIM_RE` — first-person subject (`I` / `we`, optional adverb) followed by a past-tense verb (`-ed` or a list of irregulars: led / built / ran / wrote / grew / drove / oversaw / …) or a perfect (`I've / I have / I'd / I had` + participle). Present tense ("I work with", "I am excited") never qualifies.
3. Cut the sentence at the first **bridge** (`BRIDGE_RE`): an em/en dash; `, work / experience / skills / results / … that|which|relevant|maps|speaks|aligns|…`; `so that / which / that / and` + `maps / speaks / aligns / fits / matches / mirrors / translates / carries / applies / relates / would / will / could / should`; `maps to / speaks to / aligns with / translates into / …`; `relevant / similar / comparable / applicable / transferable to`; `the (same) kind of`; `as / just as / exactly what … your | the team / role / ad / posting`; and any `you / your / you're`. Everything after the bridge is about the employer or the fit and is not examined.
4. The remaining candidate-claim part must still match `PAST_CLAIM_RE` (otherwise the past-tense verb was after the bridge).
5. That part goes through the existing `draftClaims(claim, resumeText, jobDescription, own)`; its `mirrored` list (job-ad phrases / words the resume never uses, stems / UK-US / aliases already applied) is the finding. `own` = the user's own highlights, so words the user typed are never "borrowed".

### Stop-lists

- `FUNCTION_WORDS` gains `has have had can could would should will may might just about like why because whether` — the noise R742 measured on prose.
- `GENERIC_AD_WORDS` gains `person people role roles opportunity company` — words every ad and every letter use; `person` also removes the R744 `5-person team` false positive from `draftClaims` everywhere it is used.

### Builder cover-letter dialog (`src/pages/Builder.tsx`)

- `grounding` memo: `borrowed = kind === 'cover' ? letterBorrowing(result, resumeText, resume.jobDescription, [highlights]) : []`; counted in `groundingIssues`.
- Same `role="status"` "Check against your resume before you rely on this:" box, one paragraph per sentence:
  `Describes your past work in the job ad's words, which your resume never uses: “support specialists”, “suppliers”, “participants” — in “…documenting keyboard interactions so that planners, support specialists, suppliers, and participants could all…”. Say what you actually did, or make it about the role instead.`
- `excerptAround(sentence, firstWord)` shows a ~110-char word-bounded window around the first borrowed word (the sentence in R736 is 230 chars; the words are in its second half).
- Nothing is rewritten, blocked or auto-applied; editing the sentence re-runs the check live (verified: replacing the clause with `so that every screen stayed keyboard-accessible` clears the note).

No new AI call, no Worker change, no prompt change (R736 already tells the model "the resume records what the candidate did, not what they did not do").

## 3. Verification

- Gates: `tsc -p tsconfig.json`, `tsc -p worker/tsconfig.json`, `eslint src/lib/grounding.ts src/pages/Builder.tsx` (0 errors; pre-existing `exhaustive-deps` warning), `npm run build`, `node scripts/verify-dist.mjs` (123 sitemap URLs) — all green.
- Offline probe `qa/r745-probe.mts` — table above, 9/9 controls.
- Local `wrangler dev` replay `qa/r745-verify.cjs` (**0 AI calls**, 1280 + 375, `qa/shots/r745/`): R736-before → only the existing feelings note; R736-after → exactly the borrowing note above; R743 → no box; editing the flagged clause clears the note; 0 overflow (box right edge 856 / 335); 0 console errors; storage back to baseline.
- Production QA after deploy: see `docs/handoff-context.md` R745 entry.

## 4. Limits

- Lexical, English, advisory. A borrowed duty written with words the resume already uses is not caught; a legitimate sentence whose bridge is not in `BRIDGE_RE` will list its ad words beside real borrowings (the note says "check", never "wrong").
- Only sentences with a first-person past-tense / perfect claim are examined; "My work on X shaped …" (no `I`) and third-person letters are not.
- `draftClaims` phrase matching is the R739 one (2–3-word ad phrases + single content words absent from the resume by stem / alias); synonyms the alias table lacks look like borrowing.
- Historical sample is three production letters (quota discipline); the synthetic controls are hand-written, not a labelled corpus.
