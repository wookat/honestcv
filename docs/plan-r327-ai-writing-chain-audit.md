# R327 — exploratory production audit: AI writing chain (assistant + letters + variant picker)

## Why this scope

- Rezi's public core is AI writing (AI Resume Builder / AI Cover Letter /
  Refreshed AI Agent Interface in the 2026-08 Week 4 changelog). Our AI
  writing console was last deep-walked piecemeal: assistant @@APPLY chain
  R227–R230/R287, letter generation R238/R246/R302/R304/R305, variant picker
  R286/R319. No single end-to-end walk since the R319 avoid + R320 undo +
  R325 coaching changes landed around it.
- Audit-first round (R303/R313/R316/R322 pattern): production evidence, all
  `/api/ai/*` intercepted before network (mock fulfillments), zero quota.

## Scope

1. Assistant panel: quick tasks (local ATS reply, Target my job, Find jobs
   bridge), free-text @@APPLY proposal → card → Show in editor → Apply →
   undo; rewrite-in-place proposal; malformed reply error (R295).
2. Variant picker: rewrite + summary-draft, R319 Not helpful marks →
   regenerate avoiding (payload assertion), adjust inputs (R286), diff
   highlights/keep original (R186).
3. Letters: cover letter with addressee/highlights/tone (R238/R246/R302),
   resignation letter with tone; save to documents → R305 examples coexist;
   R304 signature add/replace/remove on a fresh AI letter; export PDF/DOCX.
4. Edge cases: 0 free-quota response shape, AI 500/network failure surfaces
   inline errors and busy resets; empty inputs keep buttons disabled with
   reasons (R165).
5. 375 strict width through assistant + letter dialogs; dark mode; baselines
   (honestcv.assistantChat, careerDocs, resume, theme) restored.

## Exit criteria

Zero P0–P2 → docs-only round; any P0/P1 fixed in-round; P3s recorded and
fixed only if narrowly scoped, else logged as candidates.
