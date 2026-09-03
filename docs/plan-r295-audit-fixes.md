# R295 — Exploratory production audit + fixes

## Round type

Exploratory production audit (same format as R270b/R290): the QA agent walked the
live editor / AI-writing / scoring / export chains on https://cv.zalize.com
(bundle `index-DcdNsNPm.js`) as a demanding real user, with every `/api/ai/*`
request intercepted pre-network (zero real AI usage). Full results in
`docs/qa-r295-plan.md`.

## Findings

- **Zero confirmed P0–P2.** All golden paths passed: entry CRUD/undo/redo/drag
  reorder/dates/hidden entries/custom sections, mark shortcuts (textarea +
  preview contentEditable), the whole mocked AI chain incl. the R294 Complete
  line regression, score breakdown/deep links/Fixed chips, real PDF/DOCX/TXT/MD
  downloads (marks, CJK, margins, hidden entries), 375/1280 layout, dark mode.
- **F1 (P3, confirmed):** the assistant chat silently swallows a malformed
  `/api/ai/assistant` response. A response without a `text` string renders no
  assistant turn, shows no error, and the transcript reload drops the user's
  message. Repro: fulfill the POST with `{"reply":"…"}`.
- **F2 (P3, subjective → accepted):** the ATS checker's "See an example score
  first" report is visually indistinguishable from a real report — even the QA
  automation initially mistook it for a real score.
- **F3 (subjective, deferred):** "Final check before download" dialog fires on
  every export while any priority fix remains; a per-session dismiss is a design
  decision — recorded as a candidate round, not changed here.

## Fixes

### F1 — visible error for malformed assistant replies

`src/components/AssistantPanel.tsx` `send()`: after `aiAssistant()` resolves,
guard the reply before rendering/persisting:

```ts
if (typeof reply !== 'string' || !reply.trim())
  throw new Error('The assistant sent back an empty reply — please try again.')
if (typeof freeRemaining === 'number') onQuota(freeRemaining)
```

The throw lands in the existing catch → inline error strip; the user's turn
stays in the persisted transcript and can be resent. The quota callback also
gains a runtime `number` guard (previously `undefined !== null` passed a
malformed value through). Well-formed responses are unchanged.

### F2 — label the example report

`src/pages/AtsChecker.tsx`: derive `isExample = resumeText === EXAMPLE_RESUME
&& jd === EXAMPLE_JD` (any edit to either textarea clears it — no state to get
stale). When set, the result card heading reads "Example ATS match score" with
a secondary badge "Example report — paste your own resume above to check
yours". Score math untouched.

## Non-goals

No worker/prompt/schema/scoring changes; F3 deferred.
