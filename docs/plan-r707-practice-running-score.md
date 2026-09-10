# R707 — Interview practice session shows a running score (and corrects the R703 gap row)

## Evidence

R703 listed "interview prep is a static brief + Q list, not a practice loop" as P1. Reading `Builder.tsx` (`PracticeSession`, `advanceSession`, `finishSession`, `analyzeAnswer`, `sessionReport`) and exercising production `/builder` → Interview Prep Brief → "Instant questions" → "Practice all N" shows that the loop already exists:

- one question at a time ("Question i of N"), Next question / End early / Finish session
- 2-minute answer timer, local per-answer score 0–100 with STAR chips (Situation / Action / Result), JD keyword coverage, pace, fillers, "we"-heavy warning — instant, no AI
- optional AI coaching per answer (`/api/ai/interview-feedback`, grounded by R705)
- finish → "Session report" with the average and `Q1 72/100 · Q2 58/100 …`, saved as a document

What Rezi's AI Interview shows that we did not: a **score visible while the session is running**. Ours only appeared in the final report. R703's row is therefore corrected (P1 → P2) rather than implemented as described.

## Design (`src/pages/Builder.tsx` only)

- `PracticeEntry` gains `score: number | null` — the local `analyzeAnswer` score captured when the answer is committed (`sessionEntries`), `null` for skipped / <10-word answers (the same threshold `sessionReport` uses).
- `runningScore = useMemo` → `{ scored, average }` over committed entries plus the current answer's live `analysis.score`; `null` when nothing is scored yet.
- Session header: `Question 2 of 5 · Running score 68/100 across 2 answers`. Same local scoring as the per-answer panel and the final report, so the three numbers agree; no AI call, no endpoint change.

## Verification

- `tsc` / `eslint` (0 errors) / `build` / `verify-dist` green.
- Production (CDP, `x-qa` not needed — zero AI calls): seed a resume with a JD, open Interview Prep → Instant questions → Practice all; type a ≥10-word answer → header shows `Running score S/100 across 1 answer` with S equal to the per-answer "Practice score"; Next question with a second answer → average of both; a skipped question does not change the count; Finish session → report average equals the last header value.
