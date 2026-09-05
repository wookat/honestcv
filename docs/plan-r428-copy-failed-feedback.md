# R428 — Silent clipboard failures on three copy buttons (SOP-10 audit node)

## Four-dimension audit (production, first-party)

- Landing/public pages: 1600px and 375px sweeps across /, /pricing/, /templates/,
  /examples/, /guides/, /ats-checker, /jobs, /documents, /samples, /dashboard,
  /builder — zero horizontal overflow, zero console errors on valid routes.
- Architecture: sitemap.xml serves 123 URLs, robots.txt points at it; all 25
  /templates/ gallery deep links map to real template ids in source.
- Investigated (and rejected) the recurring "sora-latin.woff2 preloaded but not
  used" console warning: a fresh CDP browser context fetches each font exactly
  once with an Origin header; the duplicate no-Origin fetch only appears in the
  long-lived profile (Chrome local heuristic), so it is not a site defect.
- Functional depth: swept `navigator.clipboard` call sites for the silent-failure
  class R372/R414 already fixed elsewhere.

## Confirmed defect (production evidence)

Three copy buttons set their "copied" state only on clipboard success; a rejected
`writeText` gives zero feedback and an unhandled promise rejection:

1. /ats-checker "Copy the checker link" (`AtsChecker.tsx` `linkCopied`)
2. Builder download share promo "Copy checker link" (`Builder.tsx` `shareCopied`)
3. Builder share dialog "Copy" for the published share URL (`Builder.tsx`
   `shareLinkCopied`) — worst case: the user believes their share URL is on the
   clipboard and pastes nothing.

Reproduced on production (cv.zalize.com/ats-checker): with
`navigator.clipboard.writeText` forced to reject, clicking the button leaves the
label unchanged ("Copy the checker link") — no failure state.

Contrast: /jobs follow-up "Copy email" (R372) and /documents viewer "Copy text"
(R414) already render Copied / Copy failed via a two-handler `.then`.

## Fix (smallest focused change)

Change each boolean copied state to `'idle' | 'copied' | 'failed'` and give each
`writeText` promise both handlers, mirroring R372/R414:

```tsx
void navigator.clipboard.writeText(url).then(
  () => setX('copied'),
  () => setX('failed')
)
// label: 'copied' ? 'Copied!' : 'failed' ? 'Copy failed' : <default>
```

Existing resets (`setShareLinkCopied(false)` etc.) become `'idle'`. No layout,
copy, or behavior changes on the success path.

## Validation

- Local: `npx tsc -b --noEmit`, eslint on both files, `npm run build` — green.
- Production QA: forced-reject clipboard shows "Copy failed" on all three
  surfaces with zero unhandled rejections; real clipboard success still shows
  "Copied!"/"Link copied!" and the pasted text round-trips; R414/R372 surfaces
  regress clean; localStorage restored byte-for-byte.
