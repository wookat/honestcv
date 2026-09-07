# R724 — job descriptions arrive as plain prose, not entity-encoded markup

## Evidence (production, 2026-09-07, before)

- Testing-agent golden path (`qa/r723-testing-report.md`, `qa/shots/r723/10-raw-html-description.png`): `/jobs?q=barista` → Graphcore "Senior Systems Engineer" detail pane shows `<p><strong>About the job</strong></p>…` literally.
- `GET /api/jobs/search?q=engineer` on production: **23 of 150 rows** carry raw tags in `description` (sumup, Samsara, Proton, intercom, Monzo, GitLab, Everway…). The R723 84-JD sample under-counted this at 5/84 because it sampled across queries.
- Upstream cause, measured on `arbeitnow.com/api/job-board-api?page=1`: **58 of 250** rows ship the body entity-encoded — `&lt;div class=&quot;content-intro&quot;&gt;&lt;p&gt;…` — followed by a real-markup footer (`<p><a href="https://www.arbeitnow.co.uk">…</a></p>`). All 58 are ATS-fed (.co.uk / .fr) postings. `htmlToText` stripped tags first and decoded entities last, so the encoded body came out as literal markup. Jobicy additionally double-encodes text entities (`PKI &amp;amp; SSL`, 1/50 rows).
- Downstream: the same text is the ATS / Tailor keyword source, so `li ul div h3 nbsp class` were competing with real requirements (R723 benchmark, scoring row).

## Design

`worker/index.ts`:

```ts
const decodeHtmlEntities = (s) => … (&nbsp; &lt; &gt; &#39; &quot; then &amp; last)
const isEntityEncodedMarkup = (s) =>
  count(/&lt;\/?[a-z]/gi) > count(/<\/?[a-z]/g)
const htmlToText = (html) =>
  decode(decode(
    (isEntityEncodedMarkup(html) ? decode(html) : html)
      .strip tags as before
  ))
```

- The pre-decode runs only when encoded tags outnumber real tags, so a genuine `x &lt; 5` inside real HTML still comes out as `x < 5` (probe below) and is not swallowed as a tag.
- The two trailing decodes turn Jobicy's `&amp;amp;` into `&`; a normal ad never wants a literal `&amp;` displayed.
- Cache keys bumped: per-query `jobs:v15 → v17`, shared feed snapshots `jobs:feed:v1 → v3` (R722 snapshots store already-normalised text, so without the bump Arbeitnow rows would keep the old text for up to 24 h).

## Verification

Local probe (`/tmp/r724-probe.mjs`, runs the real `htmlToText` source against the live Arbeitnow page 1): 58 encoded rows → **0 rows with tags left**; `<p>Hello &amp; welcome<br>x &lt; 5</p><ul><li>One</li>…` → `Hello & welcome\nx < 5\n• One\n• Two`; encoded `x &amp;lt; 5 &amp;amp; y` → `x < 5 & y`.

Local Worker (`wrangler dev --local`, fresh v17/v3 keys): engineer 150 / nurse 26 / designer 76 / sales manager 105 rows — 0 with tags, 0 with residual entities, three sources each.

Production after deploy (same four queries): 150 / 26 / 76 / 105 rows, **tags 23 → 0**, entities 0; `teacher` + Boston: 18 rows incl. 4 The Muse, 0 tags (Muse snapshot key bump OK). `qa/r724-verify.cjs`: `/jobs?q=barista` → Graphcore detail at 1280 and 375 has no literal markup in `innerText`, 0 console errors, storage cleared (`qa/shots/r724/`).

tsc (worker) / eslint / build / verify-dist green. Prettier reports the pre-existing style warning on `worker/index.ts` (not reformatted).

## Known limits

- Heuristic, not an HTML parser: a posting that is mostly real HTML but quotes encoded markup in its text keeps the quoted markup (correct); a posting with encoded body and more real footer tags than body tags would still leak — none of 250 Arbeitnow rows is shaped like that.
- Only the entities the previous code handled are decoded (no full named-entity table); `&#8217;`-style numeric entities other than `&#39;` pass through as before.
