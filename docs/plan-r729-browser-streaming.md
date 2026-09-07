# R729 — Cover letter / interview brief stream into the dialog while they are written

## Evidence (production, first-hand)

- R728 tail correlation: the Worker now receives the model reply as a stream and its
  first byte arrives 4–16 s into a request, but the browser still used a buffered
  `fetch(...).json()` and Builder showed only "Usually takes 15–40 seconds" until the
  whole letter existed. Measured waits for a finished letter / brief on production:
  cover-letter 17.6–29.0 s, interview-brief 49.6–58.8 s (R728 samples, 213 s outlier
  before the retry budget).
- Nothing in the UI changes total time; what changes is *when the user first sees
  text*. On the R729 production sample below the first words appear at 9.3 s and the
  full letter at 21.8 s — 12.5 s during which the user can already read.

## Design

Two independent stream layers; existing contracts untouched.

1. Worker → browser (`worker/index.ts`): `/api/ai/cover-letter` and
   `/api/ai/interview-brief` answer with SSE **only when the request carries
   `Accept: text/event-stream`**. Everything else (older bundles, curl, other AI
   endpoints, quota/validation/402 errors which are produced before the model call)
   keeps the buffered JSON `{ text, freeRemaining }` / `{ error }` shape.

   Events (`liveAiReply`, Hono `streamSSE`):

   | event   | data                              | meaning |
   |---------|-----------------------------------|---------|
   | `delta` | `"<text chunk>"`                  | text as the model produces it (`readLlmStream` → `onDelta`) |
   | `reset` | `null`                            | `callLlm` started a retry after text was already sent (interrupted stream / fast 5xx); discard what is shown |
   | `done`  | `{ text, freeRemaining }`         | authoritative final text; free quota consumed **here**, exactly like the JSON path |
   | `error` | `{ error, status }`               | the message the JSON path would have returned (502/503 wording); no quota spent |

   `callLlm(env, messages, temperature, maxTokens, live?)` takes optional
   `LlmLiveHooks { delta, reset }`; `readLlmStream(body, onDelta?)` calls `onDelta`
   per `choices[0].delta.content`. Non-stream relays (JSON body) produce no deltas
   and a single `done`.

2. Browser (`src/lib/api.ts` `postLive`): sends the `accept` header, parses SSE
   blocks, accumulates `delta`, clears on `reset`, resolves with the `done` payload,
   throws `apiError(status, …)` on `error` (same messages / `PaymentRequiredError`
   as `post`). A non-SSE response (older Worker, 400/402/429 JSON) is handled exactly
   like `post`. No `done` before EOF → "The connection dropped before the AI finished…
   free uses are only spent on a finished result."

3. Builder (`src/pages/Builder.tsx` letter dialog): `live` state; while `busy && live`
   a read-only "Draft in progress" textarea shows the text so far and the result block
   (editable textarea, Save / PDF / grounding notes) is hidden; status line says
   "Writing… you can read along; editing unlocks when the draft is complete."
   Grounding checks and placeholders still run on the final text only (partial text
   would produce false "unsupported claim" flags). Resignation letters stay buffered.

## Verification

Local (`qa/r728-run-local.sh` + `qa/r729-local.cjs`, mock relay on 8790, Worker on 8791,
fresh client id per run, quota read before/after):

| mock mode | browser events | quota | plain JSON call |
|-----------|----------------|-------|-----------------|
| stream    | 6 × delta → done; joined deltas === done.text; headers 15 ms, first delta 21 ms | 12 → 11 | 200 JSON, 11 → 10 |
| cutonce (first attempt cut mid-stream, second ok) | delta, delta, **reset**, 6 × delta → done | 12 → 11 | 200 JSON |
| cut (every attempt cut) | delta, delta, reset, delta, delta, **error** 502 "interrupted… none of your free AI uses were spent" | 12 → 12 | 502 JSON, 12 → 12 |
| json (relay ignores `stream`) | done only | 12 → 11 | 200 JSON |

Gates: `tsc` app + worker, `eslint worker/index.ts src/lib/api.ts src/pages/Builder.tsx`
(pre-existing exhaustive-deps warning only), `npm run build`, `verify-dist` green.

Production (deployed 2026-09-07 15:26 UTC, bundle `index-DDKDNO8f.js`; `qa/r729-prod.cjs`,
fresh client id, `x-qa: 1`, Alex Morgan fixture + Perk JD, one real call):

- `200 text/event-stream`, headers at 870 ms, **first delta 9 253 ms**, 364 deltas,
  `done` at 21 796 ms; joined deltas === `done.text`; `freeRemaining` 12 → 11.
- Tail: `LLM upstream {ms:20679, firstByteMs:7587, stream:true, finish:"stop",
  completion:386}`, Worker wall 21 760 ms, **CPU 33 ms** (R728: 3–8 ms) — 364 SSE
  writes cost ≈25 ms of CPU.
- Wrangler upload OK; Workers Routes listing still `code 10000` (token permission,
  unchanged).

## Not verified / limits

- The Builder dialog was not clicked through on production in this round (the API
  contract and quota path were; the dialog states were type-checked and follow the
  same `setLive` callback). One production sample only (quota discipline).
- Rewrite / summary / tailor / questions / feedback / assistant stay buffered: they
  return structured JSON (arrays) that cannot be shown half-parsed; the two
  free-text endpoints are the ones users wait longest for (brief ≈50 s).
- Client disconnect does not cancel the upstream generation (the SSE write fails
  silently and `callLlm` finishes); quota is still consumed once `done` is reached
  server-side. Same as the JSON path today.
