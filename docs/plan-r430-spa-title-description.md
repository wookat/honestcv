# R430 — per-route title/description in the raw SPA HTML

## Production evidence (first-party, 2026-08-31, post-R429)

R429 fixed the duplicate-URL signal (canonical/og:url now self-reference), but
the raw HTML for every SPA route still carries the homepage title,
meta description, og:title and og:description:

```
$ curl -s https://cv.zalize.com/ats-checker | grep -o '<title>[^<]*'
<title>RezUp — AI Resume Builder. ATS-Friendly Resumes in Minutes.
```

`/builder` and `/ats-checker` are listed in sitemap.xml as indexable pages,
yet their server-rendered snippet metadata is the homepage's. `usePageMeta`
(Layout.tsx) sets the right title/description client-side only — non-JS
crawlers and link unfurlers see identical homepage titles for every route,
so search results and shares for the ATS checker show the homepage headline.
Every static prerendered page already has unique title/description; the SPA
routes are the only gap.

## Fix (worker/index.ts only)

Extend the R429 shell-rewrite block with an `SPA_META` map (path →
title/description, copy identical to each page's `usePageMeta` call) and
rewrite `<title>`, `meta[name=description]`, `og:title` and `og:description`
alongside canonical/og:url. Routes without an entry (none today) fall back to
the shell's homepage copy. `/`, `/s/…` and the 404 branch stay untouched.

## Validation

- Local: tsc -b, eslint worker/index.ts, npm run build.
- Production QA: raw HTML title/description/og:title/og:description per route
  match the SPA's post-hydration values; homepage/static/404//s/ untouched;
  hydration keeps working (usePageMeta regression); R429 canonical regression.
