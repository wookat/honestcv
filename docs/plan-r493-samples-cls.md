# R493 — /samples loading skeleton kills the 0.777 CLS

## Evidence (production, 2026-08-31)

- Lighthouse mobile across SPA routes: `/dashboard` perf 0.73 (CLS 0), `/documents` 0.79 (CLS 0),
  `/ats-checker` 0.83, **`/samples` 0.47 with CLS 0.777** — the single worst score on the site.
- The layout-shifts audit attributes the entire 0.777 to `footer.border-t`: while
  `examplesState === 'loading'` the samples route renders nothing between the header and footer,
  so the footer sits near the top of the viewport; when `examples.json` resolves, the 9-card grid
  mounts and pushes the footer down ~3000px in one shift.
- Precedent: R309 fixed the identical pattern on `/jobs` with a loading skeleton.

## Fix (Dashboard.tsx only)

Render a placeholder while `section === 'samples' && examplesState === 'loading'`:

```tsx
{section === 'samples' && examplesState === 'loading' && (
  <>
    <h1 className="text-2xl font-bold">Sample library</h1>
    <p role="status" className="sr-only">Loading the sample library…</p>
    <div aria-hidden className="mt-4 grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-card rounded-md border shadow-sm">
          <div className="bg-muted h-44 rounded-t-md border-b" />
          <div className="space-y-2 p-3">
            <div className="bg-muted h-4 w-2/3 rounded" />
            <div className="bg-muted h-3 w-1/3 rounded" />
            <div className="bg-muted mt-2 h-10 rounded sm:h-8" />
          </div>
        </div>
      ))}
    </div>
  </>
)}
```

- Skeleton card mirrors the real card anatomy (`h-44` Thumb, title/sector lines, `min-h-10 sm:min-h-8`
  CTA) so the swap to real content is near-zero shift.
- Scoped to `section === 'samples'` — on `/dashboard` the samples block sits below existing content
  and CLS is already 0 there; not touched.
- `role="status"` sr-only line announces loading; grid is `aria-hidden`.

## Non-goals

- No change to the fetch, `examplesState` machine, failed-state card, R490 hash-scroll deps,
  or the `/jobs` skeleton.
- No new dependencies.

## QA matrix (production)

1. Lighthouse `/samples` mobile: CLS ≈ 0, perf materially above 0.47.
2. Skeleton visible during load, replaced by the real grid (9 cards) with no footer jump.
3. Failed fetch still shows the retry card (skeleton gone).
4. `/dashboard` and `/dashboard#samples` behavior unchanged (R490 regression).
5. 375px light/dark: no overflow, no console errors.
