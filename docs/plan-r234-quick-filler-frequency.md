# R234 — quick-filler frequency, placement, and per-minute rate in interview practice

## Rezi first-party evidence
- Quick Fillers guide (rezi.ai/rezi-docs/ai-interview-practice-quick-fillers): Quick Fillers is one of five AI Interview metrics; "It measures how often you rely on habitual conversational phrases like 'you know,' 'I mean,' or 'kind of'". Named examples: "You know", "I mean", "Kind of", "Sort of", "At the end of the day". "Rezi AI Interview can evaluate your frequency of habitual filler phrases and where they appear in your answers" — quick fillers "are usually inserted automatically at the start or middle of sentences". Distinguished from filler sounds ("um", "uh").
- Filler Words guide: filler sounds are a separate metric ("um", "uh").

## HonestCV gap
`analyzeAnswer` only reports *which* phrases appear (`fillers: string[]`, substring presence over 10 phrases). No frequency, no placement, no rate, and Rezi's named "I mean" / "at the end of the day" plus filler sounds (um/uh/er) aren't detected at all. The R233 timer produces an elapsed signal that is unused for filler *rate*.

## Design (local-only, zero AI, zero schema change)
- `src/lib/interviewAnalysis.ts`: new pure `analyzeQuickFillers(answer, elapsedSeconds?)` →
  `{ hits: { phrase; count; atStart }[]; total; perMinute: number | null }`.
  - Phrase list = FILLER_PHRASES ∪ {'i mean', 'at the end of the day'} ∪ sounds {um, uh, er, uhm} (word-boundary regex; multi-word phrases word-boundary too so "summer"/"berlin" never match).
  - `atStart` = occurrences at the start of a sentence (after ^ or .!? + space).
  - `perMinute` = total / (elapsed/60), 1 decimal, only when elapsedSeconds ≥ 5 given (from the R233 timer); null otherwise.
  - `analyzeAnswer`/score untouched — scoring still uses the original distinct-phrase list, so practice scores are bit-identical.
- Builder practice dialog: replace the flat "Hedging words to cut: a, b" text with a detail line built from hits: `Quick fillers: kind of ×3 (2 at sentence start), i mean ×1 — 4 total, 2.0/min` (rate only when timed). weHeavy note unchanged. Amber styling unchanged.

## Guards / non-goals
- No score, schema, persistence, or AI changes. Untimed flow shows counts/placement without a rate.
- Sounds only match as standalone words; case-insensitive.

## QA
- Counts exact (phrase ×N), sentence-start counts, um/uh/er/i mean/at the end of the day detected, "summer/berlin/verb 'erred'" negatives, rate math (6 fillers in 180s→2.0/min — capped window irrelevant, uses elapsed), untimed = no rate, score invariance vs pre-R234, 375px, dark mode, R233 regression.
