# R186 — Clearer AI rewrite review: original for comparison, diff highlights, keep-original

## Evidence
Rezi public changelog, Aug 7 2026 (Rezi Web App): "Refined AI Rewrite Feedback —
You can now enjoy a more intuitive experience when using AI to rewrite your
bullet points, with clearer options and feedback buttons directly in the
editor." The protected app remains inaccessible (OTP 403), so the exact UI is
unknown; the public claim is that the rewrite review flow offers clearer
options and explicit feedback controls.

## Current gap
Our variant picker (`variantPick` dialog in `src/pages/Builder.tsx`) shows the
three AI takes (Concise / Impact-focused / Keyword-focused) as bare clickable
cards:
- The user's original text is not shown, so they must remember what they wrote
  to judge the rewrites.
- Nothing indicates what each variant actually changed.
- There is no explicit "keep my original" choice — the only way out is the
  dialog's X / overlay click, which reads like an abort, not a decision.

## Plan
All local rendering — zero AI/worker/prompt/schema changes; same one call, same
three variants.
- Extend `variantPick` state with `original?: string`; `runRewrite` passes the
  source text, the guided summary-draft path passes the (possibly empty)
  current summary.
- When `original` is non-empty, the dialog shows a muted read-only "Your
  original" panel above the variants plus an explicit "Keep my original"
  button that closes without applying.
- New pure helper `diffNewWords(original, candidate)` (`src/lib/ats.ts` not —
  goes in `src/lib/guidance.ts`): tokenizes the original into a normalized word
  set (lowercased, punctuation/markup-stripped) and splits the candidate on
  whitespace; words absent from the original render with a subtle emerald
  highlight inside each variant card so changes are scannable at a glance.
- Variant cards keep their existing click-to-apply behavior and labels.

## Acceptance
1. Bullet rewrite with 2+ line text: dialog shows original panel, three
   variants with new words highlighted, clicking a variant applies it.
2. "Keep my original" closes the dialog and the text is untouched.
3. Summary polish path shows the original summary; guided draft from an empty
   summary shows no original panel and no highlights (everything would be new).
4. Highlight normalization: markup (`**`, `__`, links) and case/punctuation
   differences alone don't light a word up.
5. 1440px and 375px: dialog scrolls, no overflow.
6. Regressions: R163 guided summary drafts, R165 not-ready reasons, R168/R169
   guidance, R185 keyword-bullet preselect.
