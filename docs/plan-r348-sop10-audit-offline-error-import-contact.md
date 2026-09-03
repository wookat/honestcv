# R348 — SOP-10 four-dimension audit + offline AI error copy + import contact extraction

## Audit (production, bundle index-D3WF3L0e.js, zero real AI/payments/shares)

Four dimensions walked end-to-end; zero P0–P2.

- **D1 console/golden path**: landing hero (0 console errors, CLS 0, strict 375/768/1920), hero TXT upload → /ats-checker instant score 73 with priority fixes and no resume bytes sent to the server, /builder first-run "Getting started" checklist + 30-role example loader, paste-import pre-fills all sections.
- **D2 landing/static UI**: /templates/, /guides/ hub and inner guide pages correct in dark mode (R347 theme wiring), 27 internal links all HTTP 200, guide inner page strict at 375.
- **D3 functional depth**: es/fr localized headings render and persist; AI rewrite payload carries `language:'fr'` and a mocked French bullet lands in storage; DOCX carries EXPÉRIENCE/FORMATION/COMPÉTENCES + the bullet; combined export (Modern template + 1″ margins + cropped photo) verified in the PDF bytes (fr headings, bullet, `/Subtype /Image`); 60-char German compound in skills does not overflow at 375.
- **D4 architecture**: lazy chunks fetched once each with no 404s; offline editing keeps saving to localStorage and AI errors are non-sticky; 4 MB near-quota storage does not break saves; R321 cross-tab banner + Load latest regression passed.

Confirmed P3s (fixed this round):

1. **Offline/network AI failure shows the raw browser string.** With the network down, any AI action renders `Failed to fetch` inline. R347's friendly fallbacks only covered HTTP-level failures (empty-body 429/5xx); a network-level `fetch` rejection (TypeError) propagates raw.
2. **Paste import drops phone/location from a standard pipe-separated contact line.** `jane@example.com | 555-0100 | Austin TX` imports the email only:
   - `PHONE_RE = /(\+?\(?\d[\d\s().-]{7,}\d)/` requires ≥9 chars, so a 7-digit `555-0100` never matches (10-digit forms do).
   - The location scan only accepts `City, ST` with a comma; `Austin TX` fails.

Informational (recorded, not changed): Rezi's onboarding is a multi-step wizard vs our checklist (depth gap, larger design round); the paste-import dialog shows two "Import" buttons (Resume-Center one disabled) — cosmetic; hard quota-exceeded UX only partially probed.

## Design

### Offline error (src/lib/api.ts)
Wrap the `fetch` in `post()` (and keep `fetchAiQuota`'s silent null) so a network-level rejection throws a friendly message instead of the raw TypeError text:

```ts
let res: Response
try {
  res = await fetch(path, …)
} catch {
  throw new Error('You appear to be offline — check your connection and try again.')
}
```

Server-provided `error` strings, 402 → PaymentRequiredError, and the R347 429/5xx/4xx copy are unchanged.

### Import contact extraction (src/lib/importText.ts)
- `PHONE_RE` inner run `{7,}` → `{5,}` (min 7 chars total): 7-digit `555-0100`/`555 0100` now match. `findPhone` still rejects <7 digits and year ranges; comma-grouped numbers (e.g. `1,200,000`) remain excluded because `,` is not in the class.
- Location: keep the `City, ST` rule; additionally accept a comma-less `City ST` segment only when the trailing token is a real USPS state code (whitelist) — avoids false positives like "Engineer II".

Non-goals: onboarding wizard (separate design round), duplicate Import label, LinkedIn parser (own contact path already extracts phone).

## Verification
- Oracle `.tmp-smoke/r348_oracle.ts`: pipe header phone/location extraction, 10-digit regression, year-range and short-digit rejections, `City, ST` regression, non-state two-letter tail rejected.
- tsc/eslint/build; deploy; production QA: offline AI action shows the friendly copy (server copy still passes through when online), paste-import of the audit header fills email+phone+location, import regressions (existing fixture), 375/dark, baseline restore.
