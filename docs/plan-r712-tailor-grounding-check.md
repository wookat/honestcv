# R712 — Deterministic post-check for "Tailor to this job" suggestions (follow-up to R705 / R706 / R711)

## Why

The Tailor prompt (R705) says "mirror the JD's exact keywords ONLY where the underlying fact is already in the item's text — never add tools, metrics, scope, or responsibilities the item does not contain", and R706 made the endpoint re-ask when the output is malformed. Neither proves a *successful* response honoured the rule. R711 added a post-check for the interview brief / cover letter; the Tailor dialog — the one tool that writes straight into the resume once accepted — had none.

## Evidence (one real production call, `qa/r712-probe.cjs` → `qa/r712-tailor-1.json`)

Alex Morgan resume, JD written to invite inflation (6+ years, p95 latency −40%, conversion lift, Storybook ownership, Playwright/Jest 90% coverage, Datadog/Grafana, mentoring 5 engineers). The response (200, no retry) came back with 5 suggestions:

| Item | Original | Suggestion adds | `tailorClaims` |
| --- | --- | --- | --- |
| Summary | "…frontend performance…" | "shipping production…", "latency reduction and conversion improvements" | mirrored `shipping, latency, conversion` |
| Checkout bullet | "reduced median page load time from 3.2 seconds to 1.8 seconds" | "cut page load latency by **44%**" | figures `44%`; mirrored `cut, latency` |
| Design-system bullet | "Built 24 reusable UI components with Storybook…" | "**Owned** the product design system in Storybook" | mirrored `Owned` |
| Dashboard bullet | — | faithful rewording | none |
| Incident bullet | — | faithful rewording | none |

The 44% is arithmetically derivable (3.2 → 1.8) but the resume never states it; "conversion" and "Owned" are the JD's claims, not the candidate's. A hand-written truthful rewrite of the same bullets using only resume + JD vocabulary returns no flags.

## Design — `tailorClaims()` in `src/lib/grounding.ts`, UI in `TailorDialog` (client-side, no AI call, `/api/ai/tailor` contract unchanged)

```ts
tailorClaims(original, suggestion, resumeText, jobDescription): {
  figures: string[]   // figures the rewrite states that neither the original line nor the resume does
  terms: string[]     // proper-noun runs (tools / names) in neither resume nor job ad
  mirrored: string[]  // job-ad words the rewrite introduces that the resume never uses
}
```

- `figures` / `terms` reuse R711's `unsupportedClaims(suggestion, [original, resumeText])`; terms that the JD *does* contain are dropped from `terms` (they surface as `mirrored` instead — the JD naming Datadog is not proof the candidate used it, but it is a different kind of warning).
- `mirrored`: every word of the suggestion (≥ 3 letters, not a function word) whose raw or Porter-stemmed form (`stemmer`, already a dependency from R710) is absent from original + resume **and** present in the JD. Deduped by stem. Words that are in neither text are ignored (ordinary rephrasing).
- `figureSupported` (shared with R711): a `%` figure must appear as a percentage in the source, and a number preceded by `+` never counts — the first production run silently passed 44% because the resume's phone number is "+44 7700…".
- `TailorDialog`: flags computed once per response (`useMemo` over rows / snapshot / JD). Each flagged row shows an amber "Check before accepting" list with the offending items marked; header gains "N need a closer look"; the bulk button becomes "Accept the N unflagged" and skips flagged rows (they stay pending for individual Accept / Keep original). A `role=status` line explains what a flag means and that unflagged lines are not guaranteed accurate either. Nothing is blocked — the user still decides per line, as before.
- Amber panel uses the plain `amber-*` classes so the R661 `.dark` palette remap applies (a first cut with explicit `dark:` variants double-mapped and produced dark text on a dark panel: fg oklch 0.4 on bg alpha 0.4).

## Honest limits

- Heuristic, word-level. It cannot prove a paraphrased duty, scope or causal claim is true; it will miss lower-case inflation that uses only resume vocabulary ("led" → "owned" is caught only because "owned" is in this JD).
- `mirrored` is noisy by construction: a legitimate synonym the resume happens not to use ("cut" for "reduced") is flagged alongside a real inflation ("conversion"). The copy says so and leaves the decision to the user; it never rejects a suggestion.
- One real production sample (free-quota discipline); the production UI run replays that saved response through a route mock rather than spending a second use.
- No server-side retry / repair: the check is advisory, and a second model call would spend quota on a heuristic signal.

## Production evidence (index-Gmel58vv.js + Builder-CG6XqLFp.js, `qa/r712-evidence.cjs 1280|375`, `qa/r712-shot.cjs`, `qa/shots/r712-*/*`)

- Header "0 accepted · 5 to review · 3 need a closer look"; button "Accept the 2 unflagged"; rows 1–3 show the lists above (`44%` now flagged with the phone number present), rows 4–5 clean.
- Clicking the bulk button → "2 accepted · 3 to review · 3 need a closer look", 3 rows still pending with their own Accept / Keep original, bulk button gone.
- 375: warning boxes 284px wide inside the dialog, `documentElement.scrollWidth` == viewport (0 overflow); same counts and behaviour.
- Dark theme: panel bg oklch(0.28 0.05 80), text oklch(0.91 0.09 90), border oklch(0.48 0.1 80) (remapped palette, light-on-dark).
- Network: `GET /api/ai/quota` + one route-mocked `POST /api/ai/tailor`; 0 console errors; QA storage cleared afterwards.
- R711 fixture regression with the `figureSupported` change: R703 brief still angles 5, 7 / stories 1, 2, 3 / SSR; R705 brief still clean; phone "+44 7700" no longer supports "44%", "44 percent" and plain counts still do.
