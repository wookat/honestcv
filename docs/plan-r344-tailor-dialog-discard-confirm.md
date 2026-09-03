# R344 — Confirm before discarding unreviewed tailoring suggestions

## Evidence (first-hand)
- `src/pages/Builder.tsx` TailorDialog: `<Dialog open onOpenChange={(o) => !o && onClose()}>` — every close path (Esc, overlay click, X) unconditionally unmounts the dialog and all local state (`rows`).
- Tailoring suggestions cost a real AI request (quota-limited for free users). Rows carry `status: 'pending' | 'accepted' | 'skipped'`; pending rows are unreviewed suggestions that cannot be recovered without spending another request.
- Accepted changes are applied immediately via `onApply` and survive close — only the *unreviewed* pending suggestions (and an in-flight request) are lost.
- R341 QA flagged this as "Esc silently closes with unreviewed suggestions — possibly intentional"; classification: real footgun, same class as R333 (Builder tool dialog unsaved-work confirm, `window.confirm` repo pattern).

## Design
In TailorDialog only:
- Guard close when there is unreviewed work: `busy` (request in flight — quota already committed) or `pending.length > 0`.
- `onOpenChange={(o) => { if (o) return; if (unreviewed && !window.confirm(msg)) return; onClose() }}` with message
  `Discard N tailoring suggestions you haven't reviewed yet? Getting them again will use another AI request.` (busy variant: `A tailoring request is still running — close and discard its results?`).
- Cancel keeps the dialog and all row state byte-identical (no state touched on the reject path).
- Free closes: before first run, after error, `rows.length === 0`, and when every row is accepted/skipped (report visible).

## Non-goals
- No change to accepted-apply semantics, report, or quota handling.
- No custom confirm dialog (repo precedent is `window.confirm` — R191/R333).

## Verification
- Local: tsc, lint, build.
- Production (testing agent, mock `/api/ai/tailor`, zero real AI): Esc/overlay/X with pending rows show exact confirm text; Cancel preserves rows/accepted counts; OK closes; all-reviewed close is confirm-free; pristine/error close confirm-free; busy-close variant; R343 chip roving + R333 tool-dialog regression; 375px strict; dark mode; baselines restored.
