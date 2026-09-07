# R407 — /jobs?job=<id> deep links open the detail pane on mobile

## Evidence (production, 2026-08-31)
- R312 made /jobs search context shareable via the URL, including `?job=<id>` (`selectedId` seeds from `seedParams.get('job')`, Jobs.tsx:149) and R384 mints `&job=<id>` deep links from the cover flow.
- On desktop the detail pane is always visible (`hidden md:block`). On mobile it only shows when `mobileDetail` is true — and `mobileDetail` always starts `false` (Jobs.tsx:150). CDP probe at 375×812 against production: `https://cv.zalize.com/jobs?job=1749306` (valid Remotive id) renders the detail pane with `display:none` — the recipient of a shared job link, or anyone refreshing on a phone, sees only the list with a row highlighted and no detail.
- Bogus ids are already repaired: `fetchJobs` swaps an unresolvable `selectedId` for `list[0]?.id` after load (Jobs.tsx:171–175), so no fix needed there.

## Fix (minimal, Jobs.tsx only)
Seed `mobileDetail` from the same URL param that seeds the selection:

```tsx
const [mobileDetail, setMobileDetail] = useState(() => seedParams.get('job') !== null)
```

A `?job=` deep link then behaves on mobile exactly like tapping that row: detail pane open, list hidden, existing "Back to list" button returns to the list. Desktop is unaffected (both panes shown ≥md regardless of `mobileDetail`). Plain `/jobs` visits keep `mobileDetail=false`. If the id is bogus, the existing repair selects the first result, so the pane shows a real job rather than a blank.

## Validation
- Local: `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`.
- Production QA: 375px deep link with valid id shows detail + Back to list works; plain /jobs unchanged (list first); desktop deep link unchanged; bogus id still repairs to first job; R384/R385/R386 flows and R394 storage alerts regressions; 375 light/dark; zero console errors; zero AI/lead/share/payment traffic; baseline restored.
