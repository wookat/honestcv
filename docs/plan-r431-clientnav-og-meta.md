# R431 — og:url/og:title/og:description follow client-side navigation

## Production evidence (first-party CDP, 2026-09-05, post-R430)

Entry on /builder then header-link navigation to /jobs:

```
{"path":"/jobs",
 "canonical":"https://cv.zalize.com/jobs",        # CanonicalSync (R309) updates
 "title":"Job search — RezUp",                    # usePageMeta updates
 "desc":"Browse remote jobs, track your applications…",  # usePageMeta updates
 "og":"https://cv.zalize.com/builder",            # stale — entry route
 "ogTitle":"Resume Builder — RezUp"}              # stale — entry route
```

After any client-side navigation the head disagrees with itself: canonical,
<title> and meta description describe the current route while og:url,
og:title and og:description still describe the entry route. Anything reading
the live DOM — share-sheet integrations, browser extensions, SPA-rendering
crawlers — gets contradictory metadata. Banked by R429 QA; now confirmed
first-hand.

## Fix (client only, two small extensions)

- `CanonicalSync` (App.tsx): also set `meta[property="og:url"]` alongside the
  canonical href.
- `usePageMeta` (Layout.tsx): also set `og:title` from `title` and
  `og:description` from `description`.

Raw-HTML rewrites (R429/R430 worker) are untouched; the client now keeps the
same tags consistent after hydration and navigation.

## Validation

- Local: tsc -b, eslint on the two files, npm run build.
- Production QA: enter on /builder, client-nav to /jobs and /dashboard —
  canonical/og:url and title/og:title/description/og:description all match the
  current route at every step; direct loads unchanged; raw HTML (no JS)
  regression for R429/R430; zero console errors.
