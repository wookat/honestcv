# R432 — shared-resume links unfurl as the candidate, not homepage marketing

## Production evidence (first-party, 2026-09-05)

`worker/index.ts` notFound: live `/s/<id>` pages resolve to the raw SPA shell
with `body = shell.body` untouched — the R429/R430 rewrite branch only fires
for `SPA_ROUTES`. So the raw HTML every link-unfurler sees is:

```
<title>RezUp — AI Resume Builder. ATS-Friendly Resumes in Minutes.</title>
og:title  = RezUp — AI Resume Builder. ATS-Friendly Resumes in Minutes.
og:url    = https://cv.zalize.com/
description/og:description = homepage marketing copy
```

The whole point of a share link is pasting it to a recruiter in Slack /
WhatsApp / LinkedIn DMs — every one of those unfurls the raw HTML. The
recipient sees a RezUp marketing card instead of the candidate's name.
The snapshot is already in KV and already fetched on this exact request
(`shareLive` check), so the name is available at zero extra cost.

## Fix (worker/index.ts notFound only)

- Capture the KV value the `shareLive` check already reads.
- When live, parse the `ShareRecord`, read `resume.contact.fullName` /
  `contact.title` (both HTML-escaped).
- Rewrite the shell:
  - `<title>` / `og:title` → `"<fullName> — <title>"` (or just the name;
    fallback `"Shared resume"`) + `" | RezUp"`.
  - description / `og:description` → `"<fullName>'s resume, shared with you
    via RezUp."` (name-less fallback keeps a generic line).
  - `og:url` → `https://cv.zalize.com/s/<id>`.
- Keep: `X-Robots-Tag: noindex`, `Cache-Control: no-store`, 200 for live,
  404 + untouched shell for revoked/unknown ids, SPA_ROUTES branch unchanged.

## Validation

- Local tsc/eslint/build.
- Production QA: create NO real share (policy) — verify via mock-free curl on
  a QA-created-then-deleted share only if the testing agent judges it safe with
  its own token cleanup; otherwise verify live-path rewrite logic against a
  temporary share created and immediately revoked by the QA script, plus
  regression: /s/bogus0000 still 404 + homepage shell + noindex/no-store,
  SPA routes and homepage unchanged, hydrated share page renders normally.
