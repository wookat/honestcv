# R425 — honest not-found feedback for bogus ?example deep links

## Production evidence (CDP @1280, https://cv.zalize.com)

- /builder?example=<bogus-slug>: examples.json loads fine, `list.find` misses,
  and the effect returns silently — empty draft, no message, URL keeps the dead
  param. A renamed/removed example slug (the /examples/ pages deep-link here)
  degrades into a silent no-op; R416 made *fetch failures* honest but the
  not-found branch was left mute.

## Scope

- Builder.tsx only: new `exampleNotFound` state; when the slug matches no entry,
  show a bottom alert bar ("This example resume wasn't found — it may have been
  renamed or removed." + Browse examples link to /examples/ + Dismiss) and clear
  the dead param (same replaceState as the found path). Fetch-failure bar and
  found path byte-identical.

## Validation

- Local: tsc, eslint, build.
- Production QA: bogus slug → alert bar, param cleared, draft untouched, zero
  console errors; valid slug applies as before; no bar without ?example;
  R416 fetch-failure bar regression; baseline byte restore.
