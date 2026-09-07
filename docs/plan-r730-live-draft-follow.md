# R730 — Live draft follows the newest line; R729 clicked through on production

## Evidence (production, first-hand)

R729 shipped browser streaming but the dialog itself was not clicked through on
production. `qa/r730-evidence.cjs` opens `/builder` on cv.zalize.com with a fresh
`x-client-id`, seeds the fixture resume + job ad, opens **Cover Letter**, presses
Generate and samples the dialog every 250 ms (one real AI call):

| moment                | t (ms) | dialog                                               |
|-----------------------|--------|------------------------------------------------------|
| response headers      | 746    | `200 text/event-stream`                              |
| first live text       | 26 973 | "Draft in progress" read-only textarea, 84 chars     |
| mid-stream sample     | 42 153 | 608 chars, status "Writing… you can read along…"     |
| done                  | 50 610 | live textarea gone; result textarea 2 012 chars, `readOnly === false` |

Console errors 0; AI requests exactly `GET /api/ai/quota` + one
`POST /api/ai/cover-letter` with `Accept: text/event-stream`; localStorage back to
baseline afterwards. Screenshots `qa/shots/r730/01…04-*.png`.

Two things the click-through exposed:

1. **The live textarea does not follow the text.** It is `rows={14}`; the sample above
   overflowed it at ~700 chars, after which the newest sentence was written below the
   fold and the reader saw a static first screen while the status said "Writing…".
   The whole point of R729 is reading along, so this defeats it for anything longer
   than 14 lines (every cover letter, every brief).
2. The status line promised "first words usually appear within 10 seconds"; production
   samples so far are 9.3 s (R729) and 27.0 s (this run) — the upstream first-byte
   varies 4–27 s (R728 tail). Copy now says 10–30 s.

Also confirmed: the first version of the probe declared "done" at 1.2 s because it
used `!generateButton.disabled` as the finish signal; the button is briefly re-enabled
between the quota check and the request. Probe bug, not product — fixed to wait for the
status line to disappear *and* the result textarea to be editable. That false run did
spend one free use, so the remaining production evidence was kept to one call.

## Design

`src/pages/Builder.tsx` letter dialog only:

- `liveRef` on the "Draft in progress" textarea; `followLive` ref starts `true`.
- Effect on `[live]`: when `followLive` is set, `scrollTop = scrollHeight` after each
  delta; when `live` becomes empty (dialog reset, retry `reset`, generation finished)
  `followLive` is re-armed so the next draft follows again.
- `onScroll`: `followLive = scrollHeight - scrollTop - clientHeight < 24` — the reader
  scrolling up to re-read a paragraph stops the auto-follow; scrolling back to the
  bottom re-enables it. No new state, no re-render per scroll event.
- Final (editable) result textarea untouched; grounding/placeholder checks still run on
  the finalized text only.

## Verification

- `npx tsc --noEmit -p tsconfig.json`, `npx eslint src/pages/Builder.tsx` (0 errors;
  pre-existing `jumpToSection` exhaustive-deps warning), `npm run build`,
  `node scripts/verify-dist.mjs` — green.
- Local (`wrangler dev` + `qa/r728-mock-llm.cjs` in `MODE=stream LONG=1`, 12 long
  paragraphs ≈ 3.1 KB, `qa/r730-local.cjs`, two runs):
  - **follow**: 31 samples, 25 with overflow, **25/25 `scrollTop == max`**; final
    result 3 146 chars, editable.
  - **reader scrolls up**: after `scrollTop = 0` mid-stream, 24 overflowing samples,
    **0 pulled back to the bottom** (`top 0` at the end while `max 656`); final result
    editable. Console errors 0.
- Production: deployed, edge serving `Builder-NTS2pr40.js` containing the new copy and
  the live textarea; the R730 evidence run above is the production click-through of
  the R729 stream (the follow behaviour itself is verified locally — no second paid
  call was spent on it).

## Not done / caveats

- One production cover-letter sample only (quota discipline); interview brief on
  production is covered by the R729 API probe, not a dialog click-through.
- The follow threshold (24 px ≈ one line) and re-arm-on-empty are the only heuristics;
  no persisted preference.
