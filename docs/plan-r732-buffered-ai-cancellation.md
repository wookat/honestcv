# R732 — Closing a buffered AI request cancels it at the Worker (Tailor, rewrite, assistant, …)

## Evidence (first-hand)

R731 made **live** (SSE) generation cancellable. The twelve buffered JSON AI routes
(`/api/ai/rewrite`, `summary-draft`, `skill-suggest`, `keyword-bullet`, `suggest-bullet`,
`tailor`, `cover-letter` and `interview-brief` without `Accept: text/event-stream`,
`resignation-letter`, `interview-questions`, `interview-feedback`, `assistant`) were left
"unchanged on the wire": the browser dropped the response, the Worker kept generating.

Measured on production before this round (`qa/r732-prod.cjs`, `qa/r732-proto.cjs`,
`qa/r732-prod-h2.cjs`, tails `qa/r732-prod-before-tail.jsonl`):

| path | client | Worker invocation | quota |
| --- | --- | --- | --- |
| Builder Tailor, Close × → Discard at 3.5 s, Chrome **HTTP/3** | `net::ERR_ABORTED` | `outcome ok`, wall 17.8 s, status 200 | 12 → **11** |
| `fetch` + `AbortController` 1.5 s, Chrome **HTTP/3** | `AbortError` at 1 500 ms | `outcome ok`, wall 3.6 s | 12 → **11** |
| same, Chrome `--disable-quic` (**HTTP/2**) | `AbortError` | `outcome canceled`, wall 1.5 s | 12 → 12 |
| Node `http2` client, `RST_STREAM(CANCEL)` at 4 s | — | `outcome canceled`, wall 4.0 s | 12 → 12 |
| R731 live SSE cover letter, Stop, HTTP/3 | `net::ERR_ABORTED` | `outcome canceled`, wall 15.1 s | 12 → 12 |

So the first iteration of this round (request signal threaded through `callLlm`, the
`enable_request_signal` compatibility flag, `c.req.raw.signal`) was **sufficient over
HTTP/2 and not over HTTP/3** — the protocol Chrome actually uses against cv.zalize.com.
What distinguished the working paths: the Worker had already **started writing a response
body** (SSE) or the transport carried an explicit stream reset (h2). A buffered handler
that has not sent headers yet gives the runtime nothing to observe on an h3 stream
close; the abort only surfaced once the handler tried to return, i.e. after the model
had finished.

Locally (`wrangler dev`, mock relay `qa/r728-mock-llm.cjs`), a Node `fetch` abort was
never noticed by workerd (the mock ran to the end, quota −1), while destroying the TCP
socket was — so the earlier "local runtime does not observe `request.signal`" note was at
least partly about the Node client, and the raw-TCP probe below is the local evidence.

## Design

Use the fact that R731 already proved: an in-flight response body makes a client
disconnect observable. Every buffered AI route now answers through one helper built on
Hono's `stream()` (no custom transport, no protocol work):

```ts
function bufferedAiReply(c, run: (live: LlmLiveHooks) => Promise<AiReplyBody>) {
  c.header('content-type', 'application/json; charset=utf-8')
  c.header('cache-control', 'no-store')
  return stream(c, async (s) => {
    const gone = new AbortController()
    const abandon = () => { gone.abort(); console.log('LLM buffered reply abandoned by client', { ms }) }
    s.onAbort(abandon)
    c.req.raw.signal.addEventListener('abort', abandon)
    const keepAlive = setInterval(() => void s.write(' '), 1000)   // JSON-insignificant whitespace
    let body
    try { body = await run({ signal: gone.signal }) } finally { clearInterval(keepAlive) }
    if (gone.signal.aborted) return                                 // no body, no quota
    await s.write(JSON.stringify(body))
  })
}
```

- Headers (`200`, chunked) go out immediately; one space per second keeps the body
  live until the model answers; the JSON object is written last. `JSON.parse` ignores
  leading whitespace, so the browser contract (`await res.json()`) is unchanged.
- Because the status is fixed at 200 before the outcome is known, a failure decided
  later is sent **in the body** as `{ error, status }`. `post()` in `src/lib/api.ts`
  throws the same `apiError(status, data)` for that shape as it does for a non-2xx
  response, so `PaymentRequiredError`, quota and "AI service is having trouble" handling
  in every dialog is untouched. Validation errors that are known before the model is
  called (`400 Paste the job description first.` …) still return early with a real
  status code.
- Cancellation itself is R731's machinery: `run({ signal })` passes `gone.signal` through
  `callLlm` / `callLlmJsonArray` (initial call **and** the JSON re-ask) to the upstream
  `fetch`; a fired signal returns `LLM_CANCELLED` (499) at every checkpoint — before an
  attempt, after an aborted fetch, after the stream reader — so nothing is retried and
  `consumeFreeQuota` is never reached.
- `wrangler.jsonc`: `"compatibility_flags": ["enable_request_signal"]` (build copies it
  to `dist/honestcv/wrangler.json`).

**Client**

- Buffered helpers accept an optional `AbortSignal` (`aiRewrite`, `aiSkillSuggest`,
  `aiSummaryDraft`, `aiKeywordBullet`, `aiSuggestBullet`, `aiTailor`,
  `aiInterviewQuestions`, `aiInterviewFeedback`, `aiAssistant`).
- Builder: inline AI actions (polish / suggest bullet / draft summary / suggest skills)
  register their controller in a `Set` that is aborted on unmount — a second action does
  not abort the first, and each `finally` only clears `aiBusy` if it still owns it.
  Tailor (`tailoring`), keyword-bullet drafter (`drafting`) and interview practice
  (`practicing`) each hold one controller: Close × while Tailor is busy now reads
  "Closing now stops the request — it will not finish in the background. A free AI use
  is only spent on suggestions you get to review." with _Keep waiting_ / _Stop and
  close_; closing the drafter / practice dialog or leaving the builder aborts.
- Assistant panel: the panel is modeless, so closing it keeps the reply (it lands in the
  saved history); leaving the builder aborts. `AbortError` is swallowed everywhere —
  it is the user's own Stop, not an error.

## Verification

Gates: `tsc` app + worker, `eslint worker/index.ts src/lib/api.ts src/pages/Builder.tsx
src/components/AssistantPanel.tsx` (0 errors, pre-existing `jumpToSection` warning),
`npm run build`, `verify-dist` OK (123 sitemap URLs); generated config carries
`enable_request_signal`.

Local (`wrangler dev` :8791 + mock relay :8790 `MODE=stream LONG=1`):

- `qa/r732-local-v2.cjs` — normal rewrite: headers at 15 ms, body at 10.7 s, 10 leading
  spaces, keys `text, freeRemaining`, quota 12 → 11. Summary-draft with prose mock reply
  → re-ask → in-body `{ error, status: 502 }` after 21 s, quota unchanged (the failure
  path through the 200 body).
- `qa/r732-local-tcp.cjs` — raw socket destroyed 2.5 s in (after 866 bytes of headers +
  keep-alive): Worker logged `LLM buffered reply abandoned by client {"ms":4004}`, mock
  `clientClosed: true` at 101/264 chunks, quota 12 → 12. (The Node `fetch` +
  `AbortController` variant in `r732-local-v2.cjs` left workerd unaware for the whole
  10.6 s generation — mock `clientClosed: false`, quota −1 — so the socket-level probe is
  the local evidence; browsers do close the stream, as production shows.)

Production (cv.zalize.com, bundle `index-CzG8yu9Q.js`, `npx wrangler deploy` — upload
OK, Workers Routes listing still `code: 10000`; tail `qa/r732-prod-v2-tail.jsonl`,
summarised by `qa/r732-tail-summary.py`):

| path | client | Worker invocation | quota (to +60/90 s) |
| --- | --- | --- | --- |
| Builder Tailor, Close × → **Stop and close** at 3.5 s, Chrome **HTTP/3** (`qa/r732-prod.cjs`, `qa/shots/r732-1280/`) | `net::ERR_ABORTED` at 4.7 s, dialog gone, 0 console errors | `outcome canceled`, wall 4 810 ms, log `abandoned by client {"ms":4001}` | 12 → **12** |
| `fetch` + `AbortController` 1.5 s, Chrome **HTTP/3** (`qa/r732-proto2.cjs cdp`) | `AbortError` at 1 500 ms | `outcome canceled`, wall 2 805 ms, `abandoned {"ms":2001}` | 12 → 12 |
| same, Chrome `--disable-quic` (**HTTP/2**, `qa/r732-proto2.cjs h2`) | `AbortError` at 1 501 ms | `outcome canceled`, wall 1 497 ms, `abandoned {"ms":656}` | 12 → 12 |
| Untouched "AI polish summary" run, HTTP/3 (`qa/r732-prod-complete.cjs`, `qa/shots/r732-complete/`) | headers at 1.8 s, JSON at 14.9 s, 13 leading spaces, "Pick a summary" dialog with three takes, 0 alerts, 0 console errors | `outcome ok`, wall 13 853 ms, `LLM upstream … completion 317` | 12 → **11** |

The HTTP/3 rows are the ones that consumed a free use before this change; the abort is
now seen by the Worker within ≈0.5 s of the browser's abort (one keep-alive tick).

## Limits (as observed)

- Tail evidence stops at the Worker: `outcome: canceled` plus the "abandoned" log line
  show the handler was torn down and the upstream `fetch` aborted; whether the relay /
  model stops billing at that instant is only measurable against the local mock
  (`clientClosed: true`).
- Detection granularity is the 1 s keep-alive tick (observed 0.5–1.5 s after the abort).
- Every buffered AI reply is now `Transfer-Encoding: chunked` without `Content-Length`,
  and a model-side failure travels as `{ error, status }` in a **200** body. Anything
  that consumes these routes without `src/lib/api.ts` (none in this repo; `qa/*` probes
  updated) must read the body.
- Three real production AI calls this round (one Tailor cancelled, one rewrite
  cancelled, one summary completed) plus two short direct probes; the other nine routes
  share `bufferedAiReply` and were exercised locally only.
- The Assistant panel deliberately keeps a reply running when the panel is closed but
  the builder stays open; only leaving the builder aborts it.
