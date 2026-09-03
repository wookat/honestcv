# R311 — /documents heading order (h1 → h3 skip)

## Evidence (first-party, production)
- Lighthouse 12 against https://cv.zalize.com/documents (`/home/ubuntu/qa/r311_lh_documents.json`):
  accessibility 0.98, sole failing audit `heading-order` (score 0), failing node
  `<h3 class="text-sm font-semibold">` — the "Letter examples" heading (R305).
- Route context: on `/documents` the page heading is `<h1>Career documents</h1>`
  (Dashboard.tsx `section === 'documents'` branch), so the next heading level must
  be h2; "Letter examples" was hard-coded h3.
- On `/dashboard` the documents area uses `<h2 id="documents">Career documents</h2>`,
  so h3 is correct there. `/jobs`, `/builder`, `/ats-checker` all score 1.0 across
  accessibility/best-practices/SEO — this is the only remaining page-level a11y audit
  failure found this round.

## Design
Render the "Letter examples" heading at a level matching the section context, exactly
like the existing `section === 'documents'` h1/h2 switch three lines above:

```tsx
{section === 'documents' ? (
  <h2 className="text-sm font-semibold">Letter examples</h2>
) : (
  <h3 className="text-sm font-semibold">Letter examples</h3>
)}
```

Same visual classes, no layout change; /samples never renders this block
(`section !== 'samples'` guard wraps the documents area). No worker/schema/storage
changes.

## Verification
- `npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build` locally.
- Deploy, curl-verify served bundle, re-run Lighthouse on /documents (expect
  heading-order pass, accessibility 1.0) and /dashboard regression (h3 unchanged).
- Testing-agent production QA: heading levels per route, letter-example chips/dialog
  regression, 375px strict width, dark mode, zero AI calls, baseline restore.
