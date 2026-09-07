# R429 — server-side canonical/og:url for SPA routes

## Production evidence (first-party, 2026-08-31)

Full static crawl: all 123 sitemap pages fetch 200, all 193 unique internal
links return 200, every static page has exactly one self-referencing
canonical, a title, a description and `id="main"`. The only pages that fail
the canonical check are the SPA-served routes:

```
$ curl -s https://cv.zalize.com/builder | grep -o 'canonical[^>]*\|og:url[^>]*'
canonical" href="https://cv.zalize.com/" /
og:url" content="https://cv.zalize.com/" /
```

Same for /ats-checker. Both are listed in sitemap.xml, yet the server-rendered
HTML declares them as duplicates of the homepage. `CanonicalSync` in
`src/App.tsx` (R309) corrects the canonical after hydration — but any
consumer of the raw HTML (crawlers that don't execute JS, link unfurlers
reading og:url, SEO tools) sees the homepage URL. A homepage-pointing
canonical is an explicit "do not index this URL, index / instead" signal,
which can drop /builder and /ats-checker out of the index despite the sitemap
listing them.

## Root cause

`worker/index.ts` `app.notFound` serves `spa.html` (the untouched Vite shell,
kept aside by `scripts/prerender.mjs`) verbatim for every SPA route. The shell
inherits `index.html`'s hardcoded homepage canonical + og:url.

## Fix (worker/index.ts only)

When serving the shell for a known `SPA_ROUTES` path, rewrite the shell's
canonical href and og:url to `https://cv.zalize.com<path>` before responding.
Share pages (`/s/…`) are `noindex` + `no-store` and are left untouched; the
unknown-route 404 branch is left untouched (a 404 canonical is irrelevant).

## Validation

- Local: tsc -b, eslint worker/index.ts, npm run build.
- Production QA: raw HTML canonical/og:url self-reference on /builder,
  /ats-checker, /dashboard, /documents, /samples, /jobs; homepage and static
  pages byte-identical behavior; /s/ shell untouched + still noindex;
  unknown routes still 404; SPA hydration/CanonicalSync regression.
