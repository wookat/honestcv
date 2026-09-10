# R841 — /samples card exposes one preview control and names every action

## Evidence (production R840 bundle `9ebdec89`, first-hand)

- `/home/ubuntu/qa/r841-evidence.cjs` (1280 / 375): 9 cards × **4 focusable controls** each
  (thumbnail `<button>`, star `<button>`, title `<button>`, "Use this example" `<a>`), 89 focusable
  elements on the page at both widths.
- `/home/ubuntu/qa/r841-ax.cjs` (CDP `Accessibility.getFullAXTree` + a real Tab walk at 1280):
  - thumbnail button AX name `Preview <role> sample Resume preview` (the `sr-only` label plus the
    `aria-label="Resume preview"` region inside the `aria-hidden` thumb — Chrome still folds it in);
  - title button AX name `<role>` only — nothing says it opens a preview; both open the same dialog;
  - **9 links named exactly `Use this example`** (the only in-grid duplicate names; header / footer
    `Pricing` / `My resumes` / `Job search` pairs are site navigation, out of scope);
  - **43 Tab presses** from the search box to the ninth card's Use link (7 chips + 9 × 4).
- Same-action twins are a known screen-reader / switch-user cost (WAI "redundant entry" pattern,
  WCAG 2.4.4 / 2.5.3): every card costs one extra stop and the reader hears the action once with a
  stray "Resume preview" suffix and once with no verb at all. R839 QA logged it; R644 set the
  precedent of naming actions with their subject (`Open <copy>`, `Delete copy <name>`).

## Options simulated / considered

1. Keep both stops, fix names only — still 36 stops and two identical actions per card. Rejected.
2. Merge thumbnail + title into one `<button>` — changes the card DOM the R839 hit-area tests and QA
   geometry baselines lock (star is absolutely positioned inside the card, sector `<p>` sits under
   the title). Rejected for this round: same outcome as 3 with more geometry risk.
3. **Adopted**: the thumbnail stays a pointer-only shortcut (`tabIndex={-1}` + `aria-hidden`, no
   `sr-only` label); the title button is the one keyboard / AT preview control and says so
   (`aria-label="Preview <role> sample"`, visible text contained → Label in Name); every "Use this
   example" link (card + dialog) is named `Use this example: <role>`.
   - A tabindex=-1 button still takes focus on mouse click, and Radix returns focus to it when the
     dialog closes → focus would land on an `aria-hidden` element. So the thumbnail click first
     focuses the card's title button (`button[data-sample-title]`) and then opens the dialog; Escape
     lands on the visible title at every width.
   - Zero geometry change: class list of every card element unchanged apart from dropping the
     thumbnail's focus ring (it can no longer be focused by keyboard).

## Fix (`src/pages/Dashboard.tsx`, /samples grid + preview dialog)

```diff
 <button type="button"
+  tabIndex={-1} aria-hidden
-  onClick={() => setPreviewExample(e)}
-  className="focus-visible:ring-ring cursor-pointer rounded-t-md text-left focus-visible:ring-2 focus-visible:outline-hidden">
-  <span className="sr-only">Preview {e.role} sample</span>
+  onClick={(ev) => { ev.currentTarget.parentElement?.querySelector<HTMLButtonElement>('button[data-sample-title]')?.focus(); setPreviewExample(e) }}
+  className="cursor-pointer rounded-t-md text-left">
   <Thumb … />
 </button>
 …
-<button type="button" onClick={() => setPreviewExample(e)} className="relative -my-2.5 … truncate py-2.5 …">{e.role}</button>
+<button type="button" data-sample-title aria-label={`Preview ${e.role} sample`} onClick={…} className="relative -my-2.5 … truncate py-2.5 …">{e.role}</button>
 …
-<Link to={`/builder?example=${e.slug}`}>Use this example</Link>
+<Link to={`/builder?example=${e.slug}`} aria-label={`Use this example: ${e.role}`}>Use this example</Link>   (card and dialog)
```

Tests: `tests/sample-card-a11y.test.ts` (+5, brace-aware opening-tag scanner: thumbnail
`tabIndex={-1}` + `aria-hidden` + no sr-only label; click focuses `data-sample-title` before
`setPreviewExample`; title `aria-label`; card + dialog Use link labels; exactly three focusable
controls per card). All 5 fail on the R840 tree. R839's title-button locator in
`tests/touch-targets.test.ts` was extended to accept the new attributes (assertions unchanged).
393 tests.

## Native re-test on the deployed bundle (`b176ef6b`, `index-CHSqAvFx.js` / `Dashboard-C49q3mFw.js`)

`r841-ax.cjs` again: AX controls 86 → **77**, grid names `Save <role> sample` / `Preview <role>
sample` / `Use this example: <role>` only, **0 duplicate names in the grid**, thumbnail absent from
the tree, Tab walk **43 → 34** presses to the ninth Use link (Tab from the search box lands on the
first chip; the testing agent counts 33 from an already-focused first chip — same walk).
