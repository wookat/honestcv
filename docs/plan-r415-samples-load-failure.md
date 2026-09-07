# R415 — /samples renders a blank page when the sample list fails to load

## Production evidence (2026-08-31, cv.zalize.com)
CDP probe: navigate to /samples with /examples/examples.json forced to fail
at the network layer — the main pane renders NOTHING: no "Sample library"
heading, no error, no retry (screenshot: screenshots/r415_samples_offline.png).
Source: the whole samples block is gated on `examples.length > 0` and the
fetch effect swallows both `!res.ok` (→ []) and network rejection
(`.catch(() => {})`), so a transient failure looks like the page doesn't exist.
Every other remote surface reports failures honestly since R412/R413.

## Fix
Dashboard.tsx only: track `examplesState: 'loading' | 'ready' | 'failed'`
around the existing fetch (non-ok / parse failure / rejection → 'failed').
When the dedicated `/samples` section is active and the state is 'failed',
render the page heading plus a role=alert card — "Loading the sample library
failed — check your connection and try again." — with a Try again button
that refetches. The embedded dashboard samples strip keeps its current
behavior (hidden when empty); success path byte-identical.

## Non-goals
- No change to Builder.tsx's ?example deep-link fetch (its picker is an
  in-dialog affordance, separate surface).
- No retry loop / caching layer.
