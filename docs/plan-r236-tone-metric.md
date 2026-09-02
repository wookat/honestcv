# R236 — Tone: the fifth Rezi AI Interview communication metric (text-proxy)

## First-party evidence

Rezi user docs, "AI Interview: Tone"
(https://www.rezi.ai/rezi-docs/ai-interview-practice-tone, updated 2026-08-07):

- "Tone is one of five key interview communication metrics that Rezi AI Interview
  assesses you on." The five guides on rezi-docs are Pace, Speaking Time, Quick
  Fillers, Filler Words, and Tone.
- "Tone is measured across three dimensions: **Clarity**: How clearly and logically
  your ideas come across · **Confidence**: How decisive and certain your delivery
  sounds · **Enthusiasm**: How engaged, expressive, and interested you appear."
- Clarity guidance: "Keep sentences focused on one idea at a time", low-clarity
  example is one long rambling sentence; "Use signposting phrases like 'The key
  point is…' or 'To summarize…'".
- Confidence guidance: "Replace hedging phrases ('I think', 'maybe') with clear
  assertions"; low-confidence example is dense with "I think / maybe / I guess".
- Enthusiasm guidance: "Briefly explain why something mattered to you"; the
  high-enthusiasm example carries explicit engagement language ("I really enjoy…",
  "extremely satisfying", "a big motivator for me").

## Gap in HonestCV

R233–R235 covered Pace, Speaking Time, Quick Fillers and Filler Words. Tone — the
fifth and last metric — has no equivalent anywhere in the practice analysis.

## R236 scope

Add a deterministic, local-only, advisory `analyzeTone(answer)` (no AI, no network,
no score change) that reads the three Rezi dimensions from the typed answer text.
This is explicitly a **text proxy**: Rezi assesses spoken audio (vocal stability,
pitch, energy); from typed practice answers we can only read the textual signals
Rezi itself names — sentence focus, hedging language, engagement language. Simple
rules serving as a local advisory read, not a learned model.

- Guard: `null` when the trimmed answer has < 10 words (same noise guard as R233).
- **Clarity** — sentence focus: split on `[.!?]+`; flag when the longest sentence
  exceeds 40 words ("one idea at a time"), else good. Evidence: longest-sentence
  word count.
- **Confidence** — hedging density: word-boundary count over
  `i think / i guess / i suppose / maybe / perhaps / probably / hopefully /
  i'm not sure / it seems / i feel like`; ≥ 2 hits flags, 0–1 good. Evidence: top
  hedges with counts. (Overlaps quick-filler phrases by design — Rezi's own
  confidence doc names "I think"/"maybe" again in the tone context.)
- **Enthusiasm** — engagement language: good when any word-boundary hit on
  `enjoy(ed/s) / excited / exciting / love(d) / proud / satisfying / motivates /
  motivated / motivator / passion(ate) / fascinating / rewarding / care about`;
  flag only when the answer is ≥ 40 words and has none (short answers exempt).

UI (practice analysis card, after the filler rows): one compact `Tone:` row listing
the three dimensions with per-dimension coloring — emerald when good, amber when
flagged, each flagged dimension carrying a short actionable hint quoting evidence,
e.g. `Tone: clarity — longest sentence runs 47 words; keep one idea per sentence ·
confidence — hedged (“i think” ×2, “maybe” ×1); state it directly · enthusiasm —
engaged.` Row hidden when analyzeTone returns null.

## Invariants

- `analyzeAnswer`, practice score, schema, localStorage, AI calls: unchanged.
- R233/R234/R235 rows unchanged; 375 px wrapping and dark-mode contrast maintained.
