# R258 — session-level feedback report after interview practice sessions

## Rezi first-party evidence

rezi.ai/ai-interview (fetched 2026-09-02, verbatim):

- Step 3: "**Receive your detailed AI feedback report** — In the keywords report,
  you'll see a breakdown with two different sections – 'High Priority Words' and
  'Remaining Keywords' that highlight important words, skills to incorporate into
  your resume."
- "Receive detailed analytics and a **performance score based on your response**."

The feedback report is delivered at the end of the mock interview — it is a
session-level artifact, not per-answer.

## HonestCV gap (verified in code)

`finishSession` in `src/pages/Builder.tsx` produces only a plain transcript:
header (`Practice session — <role>`, `M of N questions answered`) plus per-question
Q/A/AI-coaching blocks. There is no session-level report: no aggregate performance
score, no per-question score list, no session-wide keywords report — the user has
per-answer analysis (R201/R250) live while typing, but after finishing a
"Practice all N" session all scoring context is gone. Rezi's whole Step 3 deliverable
has no counterpart.

## Design

New pure helper in `src/lib/interviewAnalysis.ts` (zero AI / network / schema):

```ts
export function sessionReport(
  entries: { q: string; a: string }[],
  jobDescription: string,
  ignoredKeywords: string[] = []
): string
```

- Scored entries = those whose answer has ≥10 words (same gate as the live
  analysis card). Each is scored with the existing `analyzeAnswer` — no new
  score math.
- Returns `''` when no entry is scored (transcript then unchanged byte-for-byte).
- Otherwise returns:
  - `Session report` heading line.
  - `Scored M of N answers · average practice score S/100` (S = rounded mean).
  - Per-question line: `Q1 46/100 · Q3 62/100` (1-based entry index — the same
    Q numbering the transcript uses; feedback-only entries under 10 words are
    counted in N but not scored).
  - Keywords report (only when the JD yields keywords after `ignoredKeywords`
    filtering, i.e. `analyzeAnswer(...).keywords !== null`):
    - `Keywords covered across the session: a, b (X of Y)` — union of covered
      across scored answers, JD extraction order; cap 8 + `+N more`; when the
      union is empty the line reads `Keywords covered across the session: none (0 of Y)`.
    - `High Priority Words still missing: …` — JD keywords covered by no scored
      answer, filtered to the high-priority set (R202/R250 universe), extraction
      order, cap 8 + `+N more`; omitted when empty.
    - `Remaining Keywords still missing: …` — the non-high-priority missing ones,
      same order/cap; omitted when empty.

`finishSession` prepends the report (when non-empty) between the existing header
and the transcript, separated by blank lines. The report is part of the existing
`result` text, so the copy/download/save-to-documents paths inherit it unchanged.

## Non-goals

No AI, worker, schema, localStorage, or score-formula changes; no per-answer UI
changes; no new session model. The AI coaching path and R257 instant questions
are untouched.

## Verification

- tsx oracle byte-compare on fixtures: multi-answer session with JD (scores,
  average, union coverage, both missing tiers with caps), skipped questions
  (unanswered entries excluded from M but keep question indices), no-JD session
  (score lines only, no keywords section), all-skipped session (report absent,
  transcript byte-identical to pre-R258), ignoredKeywords excluded.
- Production QA: run a Practice-all session from R257 instant questions, finish,
  assert the report block byte-matches the oracle; regression on transcript body,
  R257/R256/R250 and delivery metrics; 375px; light/dark contrast; zero /api/ai/*
  completions; restore localStorage baseline.
