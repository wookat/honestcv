# R828 — the Builder says when the AI service is unreachable, before and after the click

## Evidence (first-hand, production, recovered new-account deployment `index-nYcB3v9R.js`)

- The relay behind `LLM_RELAY_BASE_URL` (`code-plan.site`) is `serverHold` at the .site
  registry (whois.nic.site), NXDOMAIN on 1.1.1.1 / 8.8.8.8; the Worker's `fetch` gets a 530.
  Six `POST /api/ai/summary-draft` calls (`qa/r828-prod-functional.mjs` + curl tail) all
  answered `The AI service is temporarily unavailable (530) — please retry in a minute…` in
  ≈1.8 s. `/api/health` still says `llmConfigured: true`. Outside the repo; the owner has been
  asked for a new relay base URL + key. Duration at the time of writing: > 3 h.
- What a user sees during that outage (`qa/r828-ai-outage-ui.cjs 1280`, all-sections fixture,
  storage restored byte-for-byte, 0 console errors, 2 × `POST /api/ai/suggest-bullet`):
  - Nothing before the click: every AI control is enabled (`Suggest a bullet` × 3, `AI rewrite
    bullets` × 3, `AI polish summary`, `Fix line 1 with AI`, `AI clean up skills`; only
    `Tailor to this job` is disabled, for its own reason). `/api/ai/quota` was fetched and
    answered `freeRemaining: 12` with no hint that the model cannot be reached.
  - After the click: ≈1.8 s spinner, then red text under the button — `The AI service is
    temporarily unavailable (530) — please retry in a minute. None of your free AI uses were
    spent.` Screenshot `qa/shots/r828-ai-outage/02-after-click-error-1280.png`.
  - The red text is a bare `<p class="text-destructive text-xs">` (Builder.tsx `aiButton`, from
    R165): no `role`, the button has no `aria-describedby`, and the page's live regions never
    carried the text (the harness polled `[role=alert],[role=status],[aria-live]` for 15 s and
    saw only `Saved` / the score). R692/R693 gave every other Builder error `role="alert"`; the
    `rg "error && <p"` sweep in R693 missed this one because the condition and the `<p>` are on
    different lines (`aiError && aiErrorTag === tag && (` ⏎ `<p …`). The same bare `<p>` is
    used for the variant-picker error and the picker dialog error.
  - A second click repeats the same 1.8 s and the same message. "retry in a minute" has been
    wrong for hours; the message cannot know that because nothing records the outage.
- Not measured / not claimed: how Rezi behaves when its model is down (no public evidence);
  screen-reader audio.

## Decision

Record the outage where it is observed and tell the user up front, in words that are true.

1. **Worker remembers that the relay is unreachable** (`worker/index.ts`):
   - `callLlm` classifies a failure as *unreachable* when the `fetch` threw or the upstream
     answered a gateway status (`502 | 503 | 504 | 520–530`). It is *not* unreachable on
     429 / 4xx / a model 500 / an interrupted stream / non-JSON output.
   - After the retry budget is spent on an unreachable failure, the Worker writes
     `llm:down = { since, last, status }` to KV (15 min TTL, `since` kept from the existing
     record, write throttled to once per 30 s per isolate). KV failures are swallowed (R822:
     the reply must not depend on it). On the next successful reply the record is deleted when
     this isolate had seen the outage.
   - The failure body carries the record: `{ error, status: 502, aiUnavailable: { since, last, status } }`
     through `aiFailure` (12 buffered routes) and the SSE `error` event (2 live routes). Its
     wording becomes `The AI service can't be reached right now (530). None of your free AI
     uses were spent.` — no "retry in a minute" for a failure the Worker knows is not transient
     on the user's side. Other failure texts are unchanged.
   - `GET /api/ai/quota` returns `aiUnavailable` alongside `freeRemaining` when the record
     exists (the Builder already fetches it on load). `GET /api/health` adds
     `llmUnreachableSince` (ms epoch or `null`) so the tail / uptime checks see it; the route
     stays 200 when KV throws.
2. **Builder shows one banner** (`src/pages/Builder.tsx`, `src/lib/api.ts`):
   - `api.ts` keeps an `aiOutage` store (`subscribeAiOutage`); `fetchAiQuota`, `post` and
     `postLive` update it from `aiUnavailable` in any response body, and a successful AI reply
     clears it.
   - The Builder renders a `role="status"` banner above the Target-job section while the store
     is set: *AI tools can't be reached right now — the AI service has been offline since
     HH:MM (last failed HH:MM). Suggestions, rewrites and tailoring will fail until it is back;
     none of your free AI uses are spent. ATS score, preview and downloads are unaffected.*
     The AI buttons stay enabled — the banner is a disclosure, not a lock; a user may try.
   - The bare inline errors get `role="alert"`, an `id`, and the button `aria-describedby`
     while the error is shown (same shape as R692/R693).

Rejected: disabling every AI button during an outage (the record is per-colo-observed and
15 min stale at worst — locking the user out on stale data is worse than a truthful banner);
a health probe to the relay on every `/api/ai/quota` (an upstream call per page load);
storing the marker in the Cache API only (per-colo, the "since" would differ by edge — KV is
the shared store and its failure is already handled).

## Verification

- `tests/worker-ai-outage.test.ts` (Worker-level, real `worker.fetch`, memory KV, mocked
  `fetch` to the relay): 530 → body `aiUnavailable`, KV record, `/api/ai/quota` and
  `/api/health` expose it; a 200 reply afterwards clears it; a 429 does not mark; KV throwing
  does not change the reply. **4 of 5 fail on the R827 Worker** (`git stash worker/index.ts`
  proof; the KV-broken health case already passed).
- `tests/ai-outage-client.test.ts`: `fetchAiQuota` / failed AI body publish the record through
  `subscribeAiOutage`, a usable reply clears it, a model-side 429 leaves it alone; source-level —
  every `{aiError}` paragraph is `role="alert"`, the button gets `aria-describedby`, the Builder
  subscribes and renders the `role="status"` notice.
- Gates: vitest 326 → 335, `tsc -p worker/tsconfig.json`, `tsc -b`, eslint 0 errors (known
  warnings), build, verify-dist 123.
- Deploy (new account, version `d69f4ed4`, 30 assets); production `index-B_L-vquY.js` /
  `Builder-D_ouKO9E.js` / `api-CbwL_y4D.js` SHA-identical to dist. curl with the relay still
  down: two `summary-draft` calls → `{error:"…can't be reached right now (530)…", status:502,
  aiUnavailable:{since,last,status:530}}` in 1.7–2.0 s, same `since` on the second; quota →
  `{"freeRemaining":12,"aiUnavailable":{…}}` (unchanged 12); health `llmUnreachableSince` set.
- Production QA (testing agent, `/home/ubuntu/qa/r828-qa/`, real Chrome 1280×800 and 375×667
  independently, cache disabled, storage restored byte for byte, one AI POST per width):
  notice present **before** any click at both widths (`role=status`, test id, wording; 375 rect
  16…359 fully visible, `clientWidth = scrollWidth = 375`); one `Suggest a bullet` → inline
  `p[role=alert]#ai-error-exp-…-suggest` in 2.5 s / 3.0 s, button `aria-describedby` = that id,
  button re-enabled, title still `12 free AI uses left`, same-identity quota 12 with
  `aiUnavailable` + `Cache-Control: no-store`; notice `last failed` updated (08:59 PM since,
  09:05 / 09:08 PM last) and survived reload without another POST; ATS 79 + preview render, one
  PDF (8,305 B, 2 pages) validated; axe 0 violations both widths; 173 GET / 2 POST / 1 download
  / 0 failed / 0 application console errors (one harness CSP axe-injection line, preserved).
  Not testable while the relay is down: record clearing on a real success, SSE error path on
  production, 15-min TTL expiry.
