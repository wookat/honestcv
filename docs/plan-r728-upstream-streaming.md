# R728 — AI latency sample (15 calls) → consume the upstream as a stream; stop retrying slow failures

## Evidence (production, 2026-09-07, `qa/r728-latency.mjs` + `wrangler tail` → `qa/r728-tail-parse.cjs`)

3 rounds × 5 endpoints, fresh `x-client-id` per round, `x-qa: 1`, same Alex Morgan resume / Perk JD as R726–R727. All 15 responses HTTP 200. Worker CPU 1–7 ms on every request; wall ≈ upstream `ms`.

| endpoint | wall (s) r0 / r1 / r2 | completion tokens | tok/s |
|---|---|---|---|
| rewrite | 12.3 / 6.7 / 11.1 | 128 / 99 / 187 | 11.6 / 18.2 / 18.5 |
| summary-draft | 36.4 / 13.6 / 17.8 | 620 / 430 / 340 | 17.4 / 33.6 / 20.0 |
| tailor | 27.7 / 28.0 / 31.8 | 621 / 425 / 539 | 23.1 / 15.7 / 17.4 |
| cover-letter | 17.6 / 27.9 / 24.9 | 385 / 486 / 469 | 23.0 / 17.9 / 19.5 |
| interview-brief | **213.1** / 49.6 / 58.8 | 835 / 976 / 900 | 3.9 / 20.0 / 15.5 |

- Throughput is 12–34 tok/s (median ≈ 18) and wall time is completion tokens ÷ throughput; prompt size does not show up (summary-draft with a 674-token prompt and tailor with 1342 land in the same band).
- **interview-brief round 0 = 213 s for one user click.** Tail: `LLM upstream retryable error 524` after ≈100 s, then the 1 s backoff and a second full generation (≈110 s). 524 is Cloudflare's "origin did not send response headers within 100 s"; the relay host is a secret so whether it is the relay's own CF proxy is not verified — what is verified is that a 100 s header wait ends the request and the Worker then doubles the wait by re-asking.
- At the observed floor (≈12 tok/s) a 900-token brief needs 75 s; at the round-0 rate it needs > 100 s. The brief hit the ceiling in 1 of 3 calls; tailor/summary (400–620 tokens) have ≈2× headroom, rewrite/cover-letter more.
- `prompt_tokens` from the relay is unreliable (1342 → 1 → 8 for the identical tailor prompt; 1 / 1 / 62 for the brief) — probably cache accounting; do not use it for anything.
- `LLM_THINKING=disabled` was on for all 15 calls; no reasoning fields came back (same as R727).

## Decision

Not streaming to the browser yet (that is a UI change per dialog and does not change total time). Two server-side changes in `callLlm`, both invisible to the client contract:

1. **Request `stream: true` and assemble the reply in the Worker.** Response headers then arrive with the first token (seconds), so a 100 s header timeout anywhere between us and the model cannot fire; only a >100 s *silence* would. Content is accumulated from `choices[0].delta.content`; `finish_reason`, `model` and (when the relay sends a usage chunk) `usage` are taken from the chunks. A relay that ignores `stream` and answers JSON is handled by the existing parse path (branch on `content-type`). Diagnostics gain `firstByteMs` so the tail can separate queue wait from generation.
2. **Retry only fast failures.** The one retry stays for 429/5xx/network errors that come back quickly, but an attempt that already ran ≥ 30 s is not repeated — the user gets the 502 with "none of your free uses were spent" instead of a second minute-plus wait.

Not changed: prompts, `max_tokens`, quota, the R706/R727 lenient array parsing, the client.

## Validation

- Local: mock relay `qa/r728-mock-llm.cjs` MODE=stream (SSE with `[DONE]`, usage chunk) / MODE=json (ignores `stream`) / MODE=slow524 (waits, answers 524) → Worker tail lines and response bodies checked by `qa/r728-local.cjs`.
- Gates: tsc app + worker, eslint worker/index.ts, build, verify-dist.
- Production: redeploy, 1 round × 5 endpoints with tail; each request must log `stream:true` + `firstByteMs`, same 200 shapes as before.

## Result (after deploy)

Local, `qa/r728-run-local.sh <mode>` (mock relay on :8790, `wrangler dev` on :8791, two Tailor calls each):

| mode | relay behaviour | Worker result |
|---|---|---|
| stream | SSE deltas + finish chunk + usage chunk + `[DONE]` | 200, 1 suggestion, tail `stream:true firstByteMs:4 completion:6` |
| json | ignores `stream`, answers a JSON body | 200, same suggestion, tail `stream:false` |
| cut | closes the SSE socket mid-reply, no finish | attempt logged `interrupted:true`, fast → one retry, then 502 "interrupted … none of your free uses were spent"; `freeRemaining` untouched |
| slow524 1.5 s | first request 524 after 1.5 s | retried, 200 in 2.7 s total (`LLM upstream error 524 1516ms` then a stream attempt) |
| slow524 31 s | first request 524 after 31 s | **not** retried: 502 after 31.0 s; next client call 200 |

Every request the mock saw carried `stream: true` and `thinking: {type: "disabled"}`.

Production, 2 rounds × 5 endpoints, `qa/r728b-run.out` / `qa/r728b-tail.log` (all 10 HTTP 200, same response shapes and byte sizes as R726–R728a; two tail processes were attached by mistake so the log is interleaved — the `LLM upstream` lines below were grepped out and matched to the client order):

| endpoint | wall (s) r0 / r1 | first byte (s) | completion tokens | note |
|---|---|---|---|---|
| rewrite | 18.8 / 9.9 | 15.6 / 8.4 | 119 / 129 | first token is 84–93 % of the wait |
| summary-draft | 23.2 / 18.3 | 15.2 / 11.1 | 421 / 261 | |
| tailor | 20.4 / 33.3 | 15.2 / 15.2 | 455 / 497 | |
| cover-letter | 19.6 / 29.0 | 5.4 / 5.6 | 389 / 394 | |
| interview-brief | 50.7 / 49.6 | 3.9 / 4.0 | 931 / 795 | headers now arrive at ≈4 s instead of after the whole generation |

- `stream:true` on 10/10; no retry, no 524, no interrupted stream in this sample (10 calls — it does not prove the 524 is gone, only that a header-timeout now has ≈4–16 s to fire in rather than the full generation).
- First-byte time clusters at ≈15.2 s on four requests of different sizes (rewrite 1085-token prompt, summary 674, tailor 1342) — looks like relay-side queueing, not prompt processing; cover-letter/brief get their first token in 4–6 s. Nothing we can change from the Worker; noted for the relay owner.
- Round-1 `prompt_tokens` came back as 1 on three requests — the R728a finding that this field is unreliable stands.
- Client contract unchanged: response bodies identical in shape; `freeRemaining` 11 → 7 per round as before.
