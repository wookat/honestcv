# R726/R727 — AI latency measurement, JSON-Lines replies, upstream diagnostics

## R726 — production latency sample (measurement only)

Fresh `x-client-id` per call, `x-qa: 1`, Alex Morgan resume + Perk ad (`qa/r723-jds.json`), all HTTP 200:

| endpoint | wall (ms) | bytes | notes |
| --- | --- | --- | --- |
| summary-draft | 17,244 | 1,167 | |
| tailor | 41,424 | 735 | |
| cover-letter | 20,395 | 2,088 | |
| interview-brief | 74,233 | 4,286 | |
| rewrite | 15,359 | 553 | first probe sent `kind: "bullet"` → 400; enum is `bullets` |
| tailor (2nd) | 32,619 | — | |

`wrangler tail` for the same requests: Worker CPU 6–8 ms, wall ≈ upstream. Nothing in the Worker
(KV quota read, prompt building, parsing) is measurable next to the model call, so no streaming /
architecture change was made on this sample.

## R727 — confirmed gap: Tailor replies as JSON Lines

Evidence: the second R726 Tailor call logged `LLM array retry` — the model answered

```
{"id":"b0","text":"…"}
{"id":"b2","text":"…"}
{"id":"b5","text":"…"}
```

`parseJsonArrayLenient` only accepted `[…]` (fenced / with prose / truncated), so the reply was
rejected and a second upstream call was spent re-asking for JSON (R706 path) — the user waited two
model round-trips for content the first one already contained.

### Fix (`worker/index.ts`, `worker/prompts.ts`)

- `scanTopLevelObjects(raw)`: string-aware brace scanner (escaped quotes, braces inside strings)
  that returns every complete top-level `{…}`; malformed / unterminated trailing objects are skipped.
- `parseJsonArrayLenient`: array paths unchanged; then JSON Lines / concatenated objects; a single
  wrapper object (`{"suggestions":[…]}`) unwraps to its only array. JSON Lines of bare strings is
  still rejected (not an array of objects the endpoints expect).
- `buildTailorMessages`: input items are sent as one JSON array (not one object per line, which
  the model mirrored) and the output contract says "a single array — not one object per line".
- Regression probe `/home/ubuntu/qa/r726-parse-probe.ts` (12 cases: production JSONL, truncated
  JSONL, braces in text, escaped quotes, arrays fenced / with prose / truncated, wrapper object,
  prose only, empty, string-only JSONL) → ALL PASS.

### Upstream diagnostics

`callLlm` now logs one line per upstream call — `ms`, `model`, `finish_reason`, prompt /
completion tokens, `reasoning_tokens` / `reasoning_content` length when the relay reports them,
`thinking` mode, `maxTokens`. No keys, prompts or generated text. `wrangler tail` therefore
attributes latency per call.

### `LLM_THINKING` (hypothesis, not confirmed)

GLM 5.x docs: reasoning is on by default, `"thinking": {"type": "disabled"}` turns it off.
`LLM_THINKING` (wrangler var, default unset = provider default) adds that field; a 400 from a relay
that does not know the parameter marks it unsupported for the isolate and retries once without it.

Local mock relay (`qa/r727-mock-llm.cjs`, `qa/r727-run-local.sh accept|reject`, rebuilt bundle):

- accept: both calls carry `{"thinking":{"type":"disabled"}}`, 200, log `thinking:"disabled"`.
- reject: call 1 carries it → 400 → `LLM upstream rejected thinking param` → retried without →
  200; call 2 skips it (`thinking:"default"`); relay saw 3 requests total.

Production after deploy (accepted, no 400):

| endpoint | before (ms, n) | after (ms) | completion tokens before → after |
| --- | --- | --- | --- |
| tailor | 32,619 / 38,883 / 41,424 / 60,090 (n=4) | 43,291 | 583 → 642 |
| rewrite | 15,359 / 20,744 (n=2) | 46,586 | 520 → 537 |

**Not confirmed.** Completion tokens did not shrink and the relay returns no
`reasoning_tokens` / `reasoning_content`, so either the relay strips the parameter or the model was
not reasoning. Wall time per completion token ranges 26 tok/s (rewrite 19.8 s) to 12 tok/s (rewrite
45.6 s) for near-identical prompts — the variance is upstream throughput, not our request shape.
The var stays (harmless, accepted, documented as unverified); the diagnostics are the durable
value. Next decision on latency needs a larger sample from the tail, not another guess.

## Deploy

`npm run build && node scripts/verify-dist.mjs && wrangler deploy` (deploy uploads
`dist/honestcv/index.js`; the first local mock run used the stale bundle and showed `thinking:null`
— rebuild first). Upload succeeded; Workers Routes list still fails with code 10000 (pre-existing,
permissions not changed).

Production QA after the parser deploy: tailor 200, 38.9 s, 4 suggestions (`b0 b1 b2 b5`),
`freeRemaining 11`, tail `logs: []` (no array retry). After the thinking deploy: tailor 200, 3
suggestions (`b0 b2 b5`), rewrite 200, logs above.
