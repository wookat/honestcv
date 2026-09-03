# R310 — sample thumbnail buttons fail WCAG 2.5.3 (label in name)

## Evidence (first-party, production)

- Lighthouse 12 against https://cv.zalize.com/dashboard (R309 baseline run,
  `/home/ubuntu/qa/r309_lh_dashboard.json`): audit
  `label-content-name-mismatch` scores **0** with 9 failing nodes — every
  Sample library thumbnail `<button aria-label="Preview {role} sample">`
  wrapping `<Thumb>`. axe explanation: "Text inside the element is not
  included in the accessible name". Best-practices category is 0.96 because
  of this single audit; the same cards render on the first-class `/samples`
  route (R300), so it fails there too.
- Root cause: the button's visible text is the rendered mini-resume inside
  `Thumb` (candidate name, role, summary…). The `aria-label` replaces that
  text entirely, so speech-input users who say the visible text ("Alex
  Rivera") cannot activate the control (WCAG 2.5.3 Label in Name). `Thumb`'s
  inner `aria-hidden` does not help — axe still treats the rendered text as
  the visible label when the name comes from `aria-label`.
- Rezi benchmark: accessibility is an explicit acceptance bar in the company
  product principles (Tailwind/shadcn + 无障碍可用性), and Rezi's own sample
  gallery cards expose the candidate/role text to AT rather than overriding
  it.

## Design (narrow)

`src/pages/Dashboard.tsx`, sample card preview button only:

- Drop the `aria-label` and provide the same name as content instead:

```tsx
<button type="button" onClick={() => setPreviewExample(e)} className="…">
  <span className="sr-only">Preview {e.role} sample</span>
  <Thumb … />
</button>
```

With no `aria-label`/`aria-labelledby`, the `label-content-name-mismatch`
rule no longer applies; the accessible name is computed from content —
the `sr-only` span plus nothing else (Thumb subtree is `aria-hidden`), so
screen-reader output is byte-identical to today ("Preview {role} sample").

No other change: the other two `Thumb` usages (resume copy card, draft
card) are not buttons and were not flagged; `/jobs`, `/builder`, `/` had
zero failing nodes.

## Verification

- `npx tsc -b`, eslint on Dashboard.tsx, `npm run build`.
- Deploy, then Lighthouse 12 against production `/dashboard` and `/samples`:
  expect `label-content-name-mismatch` = 1 (or n/a) and best-practices = 1.0.
- Production QA: sample preview button still opens the dialog, accessible
  name unchanged (`Preview {role} sample`), star/save button unaffected,
  375px strict width, dark mode.
