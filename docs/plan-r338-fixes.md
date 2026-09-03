# R338 — fixes from the SOP-10 audit (SOP-02 design argument)

## Findings (first-hand, production, zero AI quota)
1. P3 — hyphenated/compound tokens never match their component JD keywords.
   Reproduced on production: JD contains "Terraform"; after accepting a
   tailored summary containing "Terraform-managed infrastructure", the
   tailoring report gains `infrastructure` but `terraform` stays in
   "Still missing" (screenshot r344_d2_tailor_report.png). Root cause:
   `tokenize()` keeps `-` and `/` inside tokens (so "terraform-managed" is one
   token) and every matcher tests exact token equality (`t === kw` /
   `Set.has(kw)`), so a compound in the resume can never satisfy its parts.
2. P3 — share-create failure surfaces raw server error text. Injected 500
   `{"error":"injected"}` on POST /api/share renders literally as "injected"
   in the Share dialog (r344_d4_share_500_create.png), while revoke already
   maps failures to a friendly retry message. A network failure on create
   rejects with a raw TypeError message too.

## Design
1. Keyword matching (src/lib/ats.ts): add `matchTokenSet()` — the token set
   plus the `-`/`/`-separated parts of compound tokens — and use it at every
   resume/answer-side matching site (`matchScore`, `matchReport`,
   `scoreResumeText`, `scoreResume`, `bestEntryForKeyword`,
   interview-answer coverage in interviewAnalysis.ts). `countOccurrences`'
   single-word branch counts a token when it equals the keyword or its
   compound parts include it. JD-side *extraction* (`extractKeywords`) is
   deliberately unchanged: what keywords a JD produces stays stable; only
   whether the user's text *covers* a keyword gets smarter. Alternatives
   rejected: splitting compounds during extraction (changes every JD's
   keyword list and ranking — churn without user benefit); substring matching
   (false positives, e.g. "java" in "javascript").
2. Share create errors (src/lib/share.ts): wrap the fetch so network failures
   throw "Creating the link failed — check your connection and try again."
   (mirrors revoke); on non-OK responses surface the server's message only
   for 4xx (worker crafts user-facing 400/413/429 messages — slug taken,
   too large, daily limit) and use "Creating the link failed (<status>).
   Try again." for 5xx/anything else. No worker changes.

## Validation
- Local oracle over matchReport/scoreResume/analyzeAnswer: compound in
  resume covers component keyword; exact/phrase/plain-word matching and
  R331 stopword behavior unchanged; "java" not matched by "javascript".
- tsc/lint/build green; deploy; testing-agent production QA re-runs the
  tailoring report with the Terraform JD (should move `terraform` to
  covered) and the injected share 500 (friendly message), plus regressions:
  slug-taken 4xx message still verbatim, revoke paths, 375/dark, baselines
  restored, zero AI quota.
