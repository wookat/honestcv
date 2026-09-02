# R280 — link-aware placeholder finding in the consistency scan

## Evidence
- Carried from R279 production QA: a bullet containing `[quickly](url)` is reported by the
  Consistency dimension as `1 bracket placeholder like [quickly] still unreplaced`.
- Our own Ctrl/Cmd+K shortcut (`wrapLink` in `src/lib/marks.ts`) inserts exactly this shape:
  it wraps the selection as `[label](url)` and selects the literal `url` placeholder for typing.
  A user who wraps a link and doesn't finish the URL is left with a diagnostic that points at
  the *label* (`[quickly]`) and calls it a bracket placeholder — the actionable problem is the
  unfinished URL, not the label.
- `linkHref()` accepts `https?://…` and scheme-less `host.tld/...`; anything else (like `url`)
  keeps the token literal, so it reaches the placeholder regex `\[[^\]\n]{1,60}\]`.

## Change (minimal)
- `src/lib/marks.ts`: export `unfinishedLinks(text): { label: string; target: string }[]` — all
  `[label](target)` tokens whose target fails `linkHref()`.
- `src/lib/guidance.ts` consistency scan:
  1. Collect unfinished links across summary + bullets → dedicated finding
     `Link "label" points at placeholder "target" — replace it with a real web address.`
     (first occurrence quoted; count if >1).
  2. Remove those tokens from the text before the bracket-placeholder regex so the same token
     isn't double-flagged as `[label]`.
- Valid links (accepted by `linkHref`) are already stripped by `stripInlineMarks` — unchanged.
- Plain bracket placeholders like `[add metric]` — unchanged.

## Non-goals
- No change to `linkHref` URL validation, wrapLink UX, exports, scoring weights, schema, AI.

## Verification
- Local oracle: unfinished link → link finding + no bracket finding for the same token;
  valid link → no finding; plain `[placeholder]` → bracket finding unchanged; mixed cases.
- lint/typecheck/build green; deploy; production QA via testing agent; PR based on R279 branch.
