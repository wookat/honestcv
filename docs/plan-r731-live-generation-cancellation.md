# R731 — Stop / close cancels a running AI draft all the way to the model relay

## Evidence (first-hand)

R729 noted, as a known limit: _"client disconnect does not cancel upstream
generation."_ Reading the R729/R730 code confirmed what that meant for the user:

- The letter dialog had **no Stop control** while a letter streamed. The only way out was
  the dialog's Close ×, and `requestClose()` did not know about a running request — the
  dialog closed, the `fetch` kept running, the reply landed in state nobody could see, and
  the free use was **consumed at `done`** for a letter the user had abandoned.
- Switching document kind or leaving the builder mid-generation had the same effect.
- The Worker's `liveAiReply` never looked at `c.req.raw.signal` / `stream.onAbort`, and
  `callLlm` passed no `signal` to the upstream `fetch`, so a closed browser tab left the
  relay generating the full reply (30–75 s of model time on the free tier) and the retry
  loop would still re-ask on a fast failure nobody was waiting for.

Local reproduction before the fix (mock relay `qa/r728-mock-llm.cjs`, `MODE=stream
LONG=1`, client aborted after 3 deltas): the mock saw `clientClosed: false` until it
finished all 264 chunks and the quota counter dropped by one.

## Design

**Client (`src/lib/api.ts`, `src/pages/Builder.tsx`)**

- `post` / `postLive` take an optional `AbortSignal` and pass it to `fetch`. An abort is
  re-thrown untouched; every other network failure keeps the offline wording but now
  carries `{ cause }`. `isAbortError(e)` = `DOMException` named `AbortError`.
- `aiCoverLetter`, `aiInterviewBrief` (live) and `aiResignationLetter` (buffered) accept
  the signal.
- Letter dialog: one `AbortController` per generation in `writing` ref. **Stop** replaces
  "Start from a template" while `busy`. Close × while busy opens a confirm — "Still
  writing your cover letter … Closing now stops the draft — it will not be finished in
  the background. A free AI use is only spent on a finished draft." with _Keep writing_ /
  _Stop and close_. Switching `kind` or unmounting aborts. An aborted run sets `stopped`
  and shows "Stopped. Nothing was kept from the unfinished draft; a free AI use is only
  spent on a finished one." instead of an error; nothing is written into the result.

**Worker (`worker/index.ts`)**

```ts
interface LlmLiveHooks {
  delta;
  reset;
  signal?: AbortSignal;
}
const LLM_CANCELLED = { error: "Cancelled.", status: 499 };
```

- `liveAiReply` creates `gone = new AbortController()`; `stream.onAbort` and
  `c.req.raw.signal` both call `abandon()` (aborts once, logs `LLM live reply abandoned
by client {ms}`). After `run()` resolves it returns early when `gone.signal.aborted` —
  no `done`, no `error`, **no `consumeFreeQuota`**.
- `callLlm(…, live)` passes `live.signal` to the upstream `fetch`, checks it before each
  attempt, after an aborted `fetch` throws, and after the stream reader returns; any of
  those returns `LLM_CANCELLED`, so the retry loop never re-asks for an abandoned reply.
  The per-call tail line reports `finish: 'cancelled'`.
- Buffered JSON callers (resignation letter, arrays) are unchanged on the wire; the
  browser-side abort simply drops the response. JSON fallback / lenient array parsing
  untouched.

## Verification

Local (`wrangler dev` on :8791 + mock relay :8790, bundle rebuilt first):

- `qa/r731-local.cjs` (API): abort after 3 deltas → client `AbortError` at 322 ms; mock
  `{sent: 4, finished: false, clientClosed: true}`, still `finished: false` 1.5 s later;
  quota 12 → 12.
- `qa/r731-ui-local.cjs` (Builder, Playwright/CDP, 0 console errors):
  - S1 Stop: status "Stopped…" 83 ms after the click, live textarea gone, Generate
    re-enabled, template button back, no result / no alert; mock `finished: false,
clientClosed: true`; quota 8 → 8.
  - S2 Close while busy: confirm shown; _Keep writing_ → still streaming (mock
    `clientClosed: false`); _Stop and close_ → mock `clientClosed: true, finished: false`;
    quota unchanged.
  - S3 Untouched run completes: 3 146 chars editable, mock `finished: true`, quota 8 → 7.
- Gates: `tsc` app + worker, `eslint worker/index.ts src/lib/api.ts src/pages/Builder.tsx`
  (0 errors; pre-existing `jumpToSection` exhaustive-deps warning), `npm run build`,
  `verify-dist` OK (123 sitemap URLs).

Production (cv.zalize.com, one real AI call, `qa/r731-prod.cjs`, `qa/shots/r731/*`,
tail `qa/r731-tail.jsonl`):

- Deployed twice (`npx wrangler deploy`; upload OK, Workers Routes listing code 10000
  unchanged); edge served `index-DG3mVXtD.js` / `Builder-BqTy8DfU.js` after ≈1 min.
- Generate → "Starting…" + Stop button at 483 ms; first live text 94 chars at 14.97 s;
  Stop → status "Stopped…" **76 ms** later, live textarea gone, Generate re-enabled,
  browser reports `net::ERR_ABORTED` on the SSE POST; state identical 3 s later.
- Quota `freeRemaining` 12 → 12 after the stop. Exactly `GET /api/ai/quota` + one SSE
  POST; Escape closes the idle dialog without a confirm; storage back to baseline;
  0 console errors.
- Tail: the `/api/ai/cover-letter` invocation ended with `outcome: canceled`, wall
  15 089 ms (the full letter takes 22–51 s in R729/R730 samples) — the Worker was torn
  down at the Stop, not after the generation.

## Limits (as observed)

- Production cannot show the relay's side: a `canceled` invocation logs nothing, so the
  "abandoned by client" line and `finish: 'cancelled'` were only seen locally, and the
  mock relay is the only place `clientClosed: true` was measured. Whether the real relay
  stops billing at that moment is not observable from here.
- One real production sample (quota discipline). Interview-brief Stop verified only via
  the shared code path and the local mock.
- Retry backoff: an abort during the 1 s wait returns `LLM_CANCELLED` after the wait.
- `isAbortError` recognises `DOMException` aborts only (what `fetch` throws in browsers);
  the Builder also checks `run.signal.aborted` so a differently-shaped abort is still a
  Stop.
