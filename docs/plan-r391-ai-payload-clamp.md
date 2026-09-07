# R391 — clamp AI request payloads client-side so huge pasted inputs can't 413 every AI feature

## Evidence (source, first-hand)
- Worker gate (`worker/index.ts`): every `/api/ai/*` POST with `content-length > AI_MAX_BODY_BYTES`
  (60 000) is rejected 413 with "Request too large — trim the pasted text and retry."
- Worker prompts (`worker/prompts.ts`) only ever consume bounded slices of the long-text inputs:
  JD `slice(0, 4000)`, resume text `slice(0, 6000)`, assistant `scoreSummary slice(0, 2500)`,
  assistant turns `slice(0, 2000)` each; other fields 300–1500.
- The client (`src/lib/api.ts`) sends every field unbounded. The Builder JD textarea has no
  `maxLength` (`Builder.tsx` `id="jd"`), and R373's audit observed a 20.8 KB assistant payload from
  ordinary use. A user who pastes a whole careers page (or a scraped posting with boilerplate) as
  the JD pushes resumeText+JD+12 turns past 60 KB — then *every* assistant message, Tailor-to-job,
  cover letter, interview brief, etc. hard-fails with an error the user can't act on from those
  panels (the "pasted text" lives elsewhere, and trimming it isn't actually needed: the worker
  would only read the first few KB anyway).

## Fix (client-only, `src/lib/api.ts`)
Clamp long-text fields at the API boundary to generous multiples of what the worker prompts
consume, so behavior is byte-identical for all inputs at or under the clamps:
- `resumeText` → 9 000 (worker uses ≤6 000)
- `jobDescription` → 9 000 (worker uses ≤4 000; jobs endpoint caps 8 000)
- assistant `scoreSummary` → 3 000 (worker uses ≤2 500), turns content → 2 500 each (worker ≤2 000)
Worst-case assistant body: 12×2 500 + 9 000 + 9 000 + 3 000 ≈ 51 KB < 60 KB.

## Non-goals
- No worker/prompt/limit changes; no UI copy changes; no textarea maxLength (the JD is legitimate
  local data for the deterministic ATS scorer, which has no length problem).
