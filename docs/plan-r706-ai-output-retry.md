# R706 — AI array endpoints tolerate non-JSON / truncated model output and re-ask once before failing (P1 from R703)

## Evidence (golden path, `qa/golden-diagnostics.json`, production before this change)

`/api/ai/tailor` on the Alex Morgan fixture returned **502 "The AI service is having trouble right now"** on one golden run; the same request body succeeded when repeated. `callLlm` already retried upstream 429/5xx/network once (1s), so the failing case was a *200 from the relay whose body was not the JSON array the prompt asked for* — prose around the array, a code fence, or an array cut off by `max_tokens`. Every array endpoint did `JSON.parse(text)` directly and turned any of those into a 502 while the user saw a generic "try again in a minute".

Endpoints affected: summary draft (`/api/ai/summary`), skill suggestions (`/api/ai/skills`), tailoring (`/api/ai/tailor`), interview questions (`/api/ai/interview-questions`).

## Design (`worker/index.ts` only, plus one status line in `src/pages/Builder.tsx`)

- `parseJsonArrayLenient(text)` — strips a code fence, tries `JSON.parse`; else the `[` … last `]` slice; else salvages a truncated array by cutting back to the last complete `}` / `"` and closing the bracket (only complete leading elements survive; a non-array / unusable reply returns `null`).
- `callLlmJsonArray(env, messages, temperature, maxTokens)` — `callLlm` → lenient parse; on `null`/empty it appends the model's reply plus *"That reply was not a JSON array. Reply again with ONLY the JSON array … no prose, no markdown, no code fence."* and calls once more at `min(temperature, 0.2)`. A second failure returns the shared `AI_TROUBLE_ERROR` (502, "None of your free AI uses were spent"). Upstream errors from `callLlm` pass through unchanged.
- The four endpoints call `callLlmJsonArray`, keep their existing per-item shape validation, and only `consumeQuota` after usable output — so a re-ask never costs a second free use and a final failure costs none.
- Client: `TailorDialog` busy status switches after 45s from "Usually takes 15–40 seconds…" to a truthful "Taking longer than usual — if the first AI reply was unusable we ask it once more before giving up. Your free AI uses are only spent on a successful result." (same `role=status` node, so it is announced; the dialog never shows success on a failed request — the existing `catch` path renders the server error).

Not changed: cover letter / interview brief / interview feedback / resignation return prose and are unaffected; `callLlm`'s transport retry is unchanged.

## Verification

- `qa/r706-parse.mts` (tsx): plain / fenced / prose-wrapped / two truncation shapes / prose-only / object / `[]` → all expected.
- Local Worker (`wrangler dev --port 8791`) against a scripted OpenAI-compatible mock relay (`qa/r706-mock-llm.cjs`, `qa/r706-local.cjs`), fresh `x-client-id`, `FREE_MODE`:
  - prose reply → re-ask (4 messages, temperature 0.2) → array → **200**, `freeRemaining 12 → 11`
  - fenced + truncated reply → 2 complete items salvaged, no re-ask → **200**, `11 → 10`
  - prose twice → **502** `AI_TROUBLE_ERROR`, `freeRemaining` stays 10
  - relay unreachable → **502** "Could not reach the AI service…" after 1s, quota unchanged
- `npx tsc --noEmit -p tsconfig.json`, `npx eslint worker/index.ts src/pages/Builder.tsx` (0 errors), `npm run build`, `npm run verify-dist` green.
- Production after deploy: one real `/api/ai/tailor` call on the fixture (fresh client id, `x-qa: 1`) → 200 with suggestions; the non-JSON branch cannot be forced in production, so its evidence is the local mock run above.

## Honest limits

- The re-ask is the whole "retry" the client can talk about; the Worker does not stream progress, so the client can only condition its status text on elapsed time, not on knowing a re-ask is under way.
- Truncation salvage drops the cut-off element; if only the first element is complete the user gets one suggestion rather than an error (item-level validation still applies).
- `callLlm`'s own transport retry (1 attempt, 1s) is unchanged; a relay that returns prose *and* is slow can take ~2× the usual latency before the 502.
