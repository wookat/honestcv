# R744 — a figure kept by an AI rewrite but attached to something else is flagged ("35%: dashboard rendering performance → dashboard load times")

## 1. Evidence

### Production (R738, `qa/r738-ai-writing.json`, ai[1] — "…with key numbers" rewrite, Harbor Analytics bullets)

Original line: `Improved dashboard rendering performance by 35% through profiling, memoization and virtualized tables.`

| Variant | Line with the 35% | Existing check (`draftClaims`) |
| --- | --- | --- |
| Concise | `Boosted dashboard rendering performance by 35% through profiling, memoization, and virtualized tables` | clean (faithful) |
| Impact-focused | `Reduced dashboard **load times** by 35% to improve platform responsiveness…` | **clean** — the number exists in the resume, so `figureSupported()` passes it |
| Keyword-focused | `…improving dashboard **rendering speed** by 35%` | flagged for `technical quality` / `architecting` only |

The resume measured how fast the dashboard *renders*; the rewrite says how fast it *loads*. Same number, different claim — a recruiter checking the figure against the candidate's story finds it does not hold. Every grounding check since R712 answers "does this number appear in the resume?", none answers "is it still measuring the same thing?".

Same shape in R712 (`qa/r712-tailor-1.json`): `reduced median page load time from 3.2 seconds to 1.8 seconds` → `cut page load latency by 44%, reducing median load time from 3.2 seconds to 1.8 seconds`. The **44%** is a new figure and is already flagged; the kept 3.2 s / 1.8 s still measure load time and must stay clean.

Rezi's public pages advertise "AI-powered" bullet writing with no statement about figure fidelity; nothing observable to compare against. Listed as P2 in R743's refreshed gap list; promoted this round because it is the one class of key-number rewrite the R739–R743 chain still passes silently, and "key numbers" is the button that invites it.

## 2. Design

Lexical and advisory, like every check in `src/lib/grounding.ts`: it cannot prove semantic truth, it says what changed near the number and lets the user decide.

### `remeasuredFigures(original, rewrite): RemeasuredFigure[]` (`src/lib/grounding.ts`)

```ts
interface RemeasuredFigure { figure: string; was: string; now: string }
```

1. Both texts are split into clauses (`; , —` and sentence ends). Each figure is found with the existing `NUMBER_RE` and normalised the way `draftClaims` does (list indexes, durations, years and bare counts < 10 ignored; `%` keyed as a percentage so `35%` ≠ `35`).
2. Each figure gets a **measured phrase**: up to three content words on the side the linking preposition points to (`by 35%` → words *before*; `35% of accounts` / `120 business accounts` → words *after*), stopping at clause words (`and / or / that / which / while …`) and skipping filler (`the / a / by / from / to / of / nearly / more / …`). Tokens keep `E2E`, `Node.js`, `3.2s`, `end-to-end` whole.
3. A figure counts as **re-measured** when it appears in both texts, the original phrase has ≥ 2 content words (a bare `Saved $40k` is not a stable subject), and the rewrite phrase's head word is not the original head's stem, not any stem in the original line, and not an ATS-matcher hit (`keywordHit`: stems, UK/US spelling, alias table) against the original line.
4. Output one entry per figure with the original and new phrase, formatted `35%: dashboard rendering performance → dashboard load times`.

New figures are not this check's business — `figures` (unsupported numbers) keeps them.

### Where it runs

- `draftClaims(draft, resumeText, jd, own)` → `remeasured: remeasuredFigures(own.join("\n"), draft)` — `own` is the line(s) being rewritten (Suggest / Complete line / picker variants / assistant), so a figure moving between two of the user's *own* bullets is compared against the whole card, not just one line.
- `tailorClaims(original, suggestion, …)` → `remeasured: remeasuredFigures(original, suggestion)` per Tailor row.
- UI: `DraftFlagList.tsx` gains the group **"Your figure now measures something else"** (`REMEASURED_LABEL`, `remeasuredItems`) between "Figures your resume never states" and "Names / tools…"; the Tailor row flags in `Builder.tsx` add the same group. The picker's description now says options may "attach one of your figures to something else". Nothing else changes: flagged options still need the explicit pick / "Apply anyway", `recordAppliedAnyway` still fires only for flagged prose on the click.

### Offline probe (`qa/r744-probe.mts`, 0 AI calls, `npx tsx --tsconfig tsconfig.app.json qa/r744-probe.mts`)

| Case | Result |
| --- | --- |
| R738 production variants (18 lines) | 2 flagged: `35%: dashboard rendering performance → dashboard load times`, `… → dashboard rendering speed`; Concise variant clean |
| R712 Tailor: `3.2 s / 1.8 s` kept, new `44%` | remeasured `[]` (44% stays with the unsupported-figure check) |
| `rendering performance` → `rendering performance` reworded around it | `[]` |
| `65 Playwright end-to-end tests` → `65 Playwright E2E tests` | `[]` (alias table) |
| `65 Playwright end-to-end tests` → `65 automated checks` | flagged |
| `120 business accounts` → `120 enterprise users` | flagged |
| `30% escaped frontend defects` → `cut production bugs 30%` / `lifted conversion 30%` | flagged |
| figure-leading sentence, same metric / other metric | `[]` / flagged |
| no figures | `[]` |

Known over-report: `rendering performance → rendering speed` is a paraphrase a reader resolves at a glance; the check cannot tell it from `→ load times` and lists both. Known under-report: a one-word subject (`Saved $40k` → `Grew revenue by $40k`) is not compared (rule 3), and a re-attribution written with words that also appear elsewhere in the original line passes.

## 3. Verification

- Gates: `tsc -p tsconfig.json`, `tsc -p worker/tsconfig.json`, eslint on the three touched files (0 errors; pre-existing `only-export-components` / `exhaustive-deps` warnings), `npm run build`, `verify-dist` — green.
- Local replay (`qa/r744-mock-llm.cjs` answers with the real R738 variants joined by `===`, local `wrangler dev` on 8791, `qa/r744-verify.cjs`, 1280 + 375, 0 real AI calls): "…with key numbers" on Harbor Analytics → "Pick a rewrite"; Concise carries no note; Impact-focused carries exactly `Your figure now measures something else: 35%: dashboard rendering performance → dashboard load times`; Keyword-focused carries the `rendering speed` note plus the existing `technical quality` / `architecting` flags; stored bullets byte-identical while the dialog is open and after Escape; 0 overflow at both widths; 0 console errors; storage back to baseline.
- Production QA after deploy: same script against `cv.zalize.com` (1 real AI call) — see handoff-context for the recorded reply.
