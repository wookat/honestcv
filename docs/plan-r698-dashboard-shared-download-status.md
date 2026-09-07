# R698 — SOP-10 audit node + dashboard / shared-resume downloads: announce "Preparing… / downloaded" and hand focus back (WCAG 4.1.3 / 2.4.3)

## Audit node (production, index-DWZqs8iU.js)

Scripts reused from earlier nodes, logs under `qa/r698-*.log|json`:

| dimension | script | result |
| --- | --- | --- |
| 8 routes × 1280/375 × light/dark, per-screen scrolling axe (wcag2a/aa, 2.1, 2.2, best-practice) + tabbable names + page overflow | `r666-scan.cjs` | real violations 0/0/0/0; obscured-only (sticky header / step artefacts, same as R655+): landing 1, builder 1 (1280) / 3 (375), dashboard 2, documents 2, samples 3 (375); unnamed tabbables 0; no horizontal overflow; console errors 0 |
| forced-colors focus indicator, 8 routes | `r678-forced.cjs` | focused controls with no outline: 0 |
| 120 sitemap static pages @320 | `r677-static-sweep320.cjs` | page-level overflow: 0 |
| icon-only control non-text contrast (1.4.11), light/dark 1280 | `r666-icons.cjs` | 88 icon-only controls per theme, below 3:1: 0 |
| text spacing (1.4.12) 375/320, 10 routes | `r671-textspacing.cjs` | page 360/360 and 305/305 before/after; newly clipped text: 0 on every route |
| Rezi public pages (/, ai-resume-builder, pricing, resume-checker) | `r668-rezi.cjs` | `r698-rezi.json` — headings/CTAs/prices unchanged vs R688 snapshot; no new surface we lack |
| **live-region silence scan** (new this node) | `r698-evidence.cjs` | three silent export surfaces — below |

No new axe / contrast / reflow / forced-colors gap. The only verified gap is the one R697 flagged as
out of scope.

## Evidence (production, `qa/r698-evidence.cjs 1280`)

MutationObserver over every `[aria-live] / [role=alert|status|log]` node + 100 ms `activeElement`
poll, keyboard-only (`Enter` on the focused control), `honestcv.shared=1` so the first-download gate
is skipped, seeded copy `Sales Jedi — Creative Force` + cover letter `CF — Cover`, a real temporary
`/api/share` snapshot (revoked afterwards):

| path | before | after activation | live-region events |
| --- | --- | --- | --- |
| /dashboard saved copy → "PDF — download Sales Jedi — Creative Force" | focus on the button | button `disabled` → `activeElement` → `body`, stays there after it re-enables | none |
| /dashboard?section=documents → "Download CF — Cover as PDF" | focus on the button | same → `body` | none |
| /s/:id → "Download PDF" | focus on the button | `Preparing…` label swap while `disabled` → `body`, stays there | none |

Sighted feedback: dashboard shows a spinner in the button and nothing on completion; /s/:id swaps the
label to "Preparing…" and back. For a keyboard/AT user all three are silent and lose focus; the next
Tab restarts from the top of the page. Failure paths are already `role=alert` (`dlError`, `dl ===
'failed'`) — only progress/success is silent. Same class as R697 (builder), which fixed it with an
always-mounted `role=status` + `useFocusAfterRender({ onlyIfLost: true })`.

## Plan

`src/pages/Dashboard.tsx`

1. `downloaded: { key, fmt } | null`, set after a successful `runDownload` / `runDocDownload`, cleared
   after 1.8 s (R697 shape). Always-mounted region under the header, next to the `dlError` alert:

   ```tsx
   <p role="status" className="sr-only">
     {downloading ? `Preparing your ${fmtOf(downloading)}…` : downloaded ? `${downloaded.fmt} downloaded.` : ''}
   </p>
   ```

   The finished button shows a ✓ for those 1.8 s (builder parity) — the only visible change.

2. Every export button gets `id={`dl-${key}`}`; both `finally` blocks call
   `focusAfterDownload(`dl-${key}`)` (`useFocusAfterRender({ onlyIfLost: true })`) so focus returns to
   the re-enabled button only when it actually fell to `<body>` — a dialog that took focus meanwhile
   (placeholder warning, upgrade, free-download gate) keeps it. `pendingDl` carries the originating
   button's key so the free-download-gate path refocuses the real button instead of `'pending'`.

`src/pages/SharedResume.tsx`

3. `dl` gains a `'done'` state (auto-clears after 1.8 s); always-mounted `role=status` next to the
   button: `Preparing your PDF…` / `PDF downloaded.`; the button gets `id="share-dl-pdf"` and focus
   is handed back after the export settles via the same hook. Visible label/behaviour unchanged.

No gating, export-format or layout changes.

## Validation

```
npx tsc -b --noEmit
npx eslint src/pages/Dashboard.tsx src/pages/SharedResume.tsx
git diff --check && npm run build && npm run verify-dist
```

Production (`qa/r698-verify.cjs 1280|375`): each of the three paths yields `status:Preparing your
PDF…` → `status:PDF downloaded.` → empty and `activeElement` ends on the originating button id;
storage back to baseline; temporary share revoked; 0 console errors.

Not verified: real screen-reader listening (DOM mutation ≠ heard). Not changed: /dashboard viewer
dialog export buttons share the same `docDownload` helper and ids, so they are covered by the same
code path, but were verified only at code level.
