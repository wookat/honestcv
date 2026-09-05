# R416 — /builder?example= deep link fails silently when the example list can't load

## Production evidence (2026-08-31, cv.zalize.com)
CDP probe: navigate to /builder?example=software-engineer with
/examples/examples.json forced to fail at the network layer — the builder
opens as a plain empty draft: no alert, no explanation, the ?example param
just sits in the URL doing nothing (probe: audit-r412/probe_r416.py,
screenshot: screenshots/r416_builder_example_offline.png). Users arrive on
this URL from the public /examples/<slug> pages' "Open in builder" CTA, so
a transient failure looks like the button is broken. /samples got the
honest-failure treatment in R415; this is the remaining examples surface.

## Fix
Builder.tsx only: track `exampleLoadFailed` + `exampleLoadAttempt` around
the existing examples fetch. The failed state is only raised when the URL
actually carries ?example= (the empty-state role picker keeps its current
hidden-when-empty behavior, same call R415 made for the dashboard strip).
Render the existing fixed-bottom alert-bar pattern (role=alert, same style
as storageAlert) — "Loading the example resume failed — check your
connection and try again." — with a Try again button that refetches, plus
Dismiss. Success path byte-identical.

## Non-goals
- No change to the empty-state role picker / setup-wizard picker
  (in-page affordances, hidden-when-unavailable by design).
- No retry loop / caching layer.
