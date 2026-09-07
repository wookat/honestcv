# R736 — interview brief / cover letter stop telling the candidate what they have done and how they feel; brief post-check stops flagging verbatim STAR actions

Carried from R733's P1/P2 list ("brief infers behaviours the resume never states", "noisy grounding warning"). Chain: #954 (R735) → this PR.

## Evidence (production AI calls captured in R733, `qa/r733-diagnostics.json` → `qa/r736-brief.txt`, `qa/r736-cover.txt`; resume = sample "Alex Morgan", JD = Perk Senior Frontend Engineer)

The prompt-level grounding from R705 holds for *facts*: the brief cites an employer or a bullet for all 8 answer angles and quotes a real bullet in all 3 stories (`briefGrounding` before/after below). What it does not stop is the model writing *about the candidate beyond the resume* — statements the resume can neither confirm nor deny, which R711's post-check cannot see because they contain no name and no figure:

| where | production text | what the resume says |
| --- | --- | --- |
| brief · GAPS 1 | "Address honestly: **say you've operated at the execution-and-quality end** of product work" | nothing about where in product work the candidate operated |
| brief · GAPS 2 | "**you'd look for opportunities to scale that influence** at Perk" | nothing about ambitions |
| brief · Q1 angle | "frame the Northstar checkout and Harbor Analytics dashboards as experiences **serving distinct user needs**" | two bullets, no user-needs framing |
| brief · STORY 2 · S | "The product design system at Northstar Digital **lacked consistent, accessible components**" | bullet: "Built 24 reusable UI components with Storybook and documented keyboard interactions" — no before-state |
| cover letter ¶3 | "**I'm comfortable working alongside product managers and engineering managers to refine quarterly goals and long-term vision**" | JD duty verbatim; the resume has no PM / EM / quarterly-goals line |
| cover letter ¶3 | "**I care deeply about accessibility**" | one bullet mentions keyboard interactions; nothing about caring |

A brief that says "position it as a gap" (R705 wording) and then coaches the candidate on what to *claim* about their own history is the same fabrication at one remove: the candidate is told to say something the tool cannot know. For the letter, the "comfortable working alongside product managers…" sentence is exactly how a JD requirement becomes a candidate claim without any name or figure to catch.

Second finding (R733 P2, reproduced here): `briefGrounding` reported **"Stories 1, 2, 3 don't quote a bullet from your resume — the details may be invented"** on the production brief although every story's `A:` reproduces a resume bullet verbatim — the check only looked inside `"…"` quotation marks and the model wrote none. Same dialog: after a practice session, the *locally computed* session report ("High Priority Words still missing", "Q1 61/100") went through `unsupportedClaims` and was warned for its own labels and scores.

Baseline vs after on the production brief (`qa/r736-prod.mts` / `qa/r736-prod-before.mts`):

| | before | after |
| --- | --- | --- |
| uncitedQuestions | [] | [] |
| unquotedStories | **[1, 2, 3]** | [] |
| probe: story whose `A:` is invented ("Rebuilt the mobile app in Flutter for 2 million users") | flagged | flagged |

## Change

### Prompts (`worker/prompts.ts`)

`groundingRules` (shared by brief / questions / feedback) gains one rule:

> The resume records what the candidate did, not what they have never done and not how they feel: never tell them what they have or have not experienced beyond the resume ("you've operated at the execution end"), and never attribute preferences, comfort, opinions or working style ("comfortable working with product managers", "cares deeply about") the resume does not state. Interest in this role and company is fine.

`buildInterviewBriefMessages` section contract:

- LIKELY QUESTIONS — a topic the resume lacks is written as **"not on your resume — if you have done this, say so and add it; otherwise the closest analogue is …"** naming a real bullet (was: "no direct evidence — position it as a gap", which told the candidate to concede something the tool does not know).
- YOUR STORIES — Situation and Task come from the quoted bullet **or are bracketed placeholders — never a plausible backstory the resume does not state**.
- GAPS TO PREPARE FOR — phrased as **what the resume does not show**, then two lines: "If you have done this: …" (add it to the resume and how to say it) / "If not: …" (closest real experience, honest framing). The candidate decides which branch is true; the tool no longer asserts one.

`buildCoverLetterMessages`: "Do not claim preferences, comfort levels, opinions or working style the resume does not state ('I'm comfortable working with product managers to refine quarterly goals', 'I care deeply about …'); interest in this company and role is welcome, feelings about job-description duties are not."

### Post-checks (`src/lib/grounding.ts`, `src/pages/Builder.tsx`)

- `briefGrounding` — a story is grounded when a quoted span **or any STAR segment** (`S:` / `T:` / `A:` / `R:` / `Situation:` …, ≥ 20 chars) is a resume line (`resumeKey.includes` or ≥ 0.7 word overlap). `namesGap` also accepts "not on your/the resume".
- new `preferenceClaims(text, sources)` — first-person feeling openers (`I'm comfortable / passionate / happy / at ease / used to / drawn to / energised by …`, `I care deeply / thrive / enjoy / love / prefer / relish / value …`, `I've always …`) clipped at the first comma / 9 words; exempt when ≥ 80 % of its content words appear in the resume or the user's own "details to highlight". Cover letter only. Shown in the grounding box as **"Says how you feel, which your resume doesn't: “I'm comfortable working alongside product managers and engineering managers” — keep it only if it's true for you."** and counted as an issue for the verdict.
- Writer dialog skips grounding entirely for the local practice-session report (`/^Practice session — /`).

## Verification

- `npx tsc --noEmit -p tsconfig.json` · `-p worker/tsconfig.json` · `eslint` on the three files (one pre-existing `exhaustive-deps` warning at Builder.tsx:1588, untouched) · `npm run build` · `node scripts/verify-dist.mjs` OK.
- Probes (`qa/r736-probe.mts`): production cover letter → 2 feeling claims; same with highlights "I care deeply about accessibility" → 1 (user's own words exempt); a letter with only "I'd welcome the chance… I am excited by the role" → 0. Production brief stories 3/3 flagged → 0/0; invented `A:` still flagged.
- Production after deploy: one real interview brief + one real cover letter with the R733 inputs (see handoff-context R736 for the transcript excerpts and the dialog verdicts).

## Known limits

- Prompt rules steer; they do not guarantee. Only the letter's first-person feelings have a deterministic catch; brief-side "you've operated at…" second-person inferences are prompt-only (a regex on "you've/you have + past participle" would hit legitimate cites like "you've led the checkout redesign at Northstar").
- `preferenceClaims` is English and opener-based; "Collaboration with PMs is second nature to me" passes. Exemption is word-overlap, so a resume summary that says "passionate about accessibility" exempts "I'm passionate about accessibility" but not "I'm passionate about inclusive design".
- STAR-segment grounding trusts any one segment; a story whose `A:` is real but whose `S:` is invented is no longer flagged (the prompt now tells the model to bracket S/T, and the earlier state was flagging every real story, which drowned the signal).
- One production sample per endpoint after deploy (quota discipline).
