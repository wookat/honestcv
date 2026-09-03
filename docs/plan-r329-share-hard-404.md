# R329 — revoked/unknown share links return HTTP 404, not a 200 soft-404

## Evidence

- R328 SOP-10 audit (first-hand production check): after revoking a share,
  `GET /s/<id>` still returns HTTP 200 with the SPA shell; the SPA renders
  "This link is no longer available" (content-level correct), but at the HTTP
  level the URL is a classic soft-404. The worker's own comment says the
  no-store rule exists "so a revoked link 404s immediately" — the status
  never actually did.
- Share pages already send `X-Robots-Tag: noindex` + `Cache-Control:
  no-store`, so the fix is purely about honest status codes for crawlers and
  link checkers (Search Console flags soft-404s; social unfurlers retry 200s).

## Design (worker only, one lookup)

In the `notFound` SPA-shell handler, valid-looking `/s/<id>` paths do a single
`KV.get('share:<id>')` existence check: present → 200, absent (revoked,
expired, or never existed) → 404. The same shell body is served either way, so
the SPA experience is unchanged — the reader still sees the branded
"no longer available" card. `SPA_ROUTES` and all other paths untouched.

Pseudo-diff:

```ts
const isShare = path.startsWith('/s/') && validShareId(path.slice(3))
+ const shareLive = isShare && (await c.env.KV.get(`share:${path.slice(3)}`)) !== null
...
- status: SPA_ROUTES.has(path) || isShare ? 200 : 404,
+ status: SPA_ROUTES.has(path) || shareLive ? 200 : 404,
```

## Out of scope

- /jobs tailoring-report chip filtering (R328 candidate ii) — separate
  decision, touches score semantics.

## QA (production)

Live share → 200 + snapshot renders; revoke → same URL now HTTP 404 while the
page still shows the "no longer available" card; unknown-but-valid-shaped id →
404 + card; malformed id → 404 (existing behavior); share create/view/revoke
UI regression; X-Robots-Tag/no-store unchanged; zero AI.
