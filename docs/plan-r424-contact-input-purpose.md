# R424 — input purpose on the Builder contact fields

## Production evidence (CDP probe @1280, https://cv.zalize.com/builder)

- Every contact-card input (Full name / Professional title / Email / Phone /
  Location / Website / LinkedIn) renders with `autocomplete=null`, plain
  `type="text"`, no `inputMode`. Browsers cannot autofill the user's own
  name/email/phone (WCAG 1.3.5 Identify Input Purpose, AA), and mobile
  keyboards show the generic layout for email/phone/URL fields.
- Elsewhere the app already does this right: the References email input is
  `type="email"`, both Paywall email inputs are `type="email"` — the contact
  card (the single most-typed personal-data surface) was simply missed.

## Scope

- Builder.tsx contact card only: add `autocomplete` and `inputMode` per field.
  No visual, layout or value-handling change; `type` stays "text" so no UA
  validation styling can appear.

## Implementation

Extend the contact field tuple with autocomplete/inputMode:
- fullName → autoComplete="name"
- title → autoComplete="organization-title"
- email → autoComplete="email", inputMode="email"
- phone → autoComplete="tel", inputMode="tel"
- location → (no reliable single token; left as-is)
- website → autoComplete="url", inputMode="url"
- linkedin → inputMode="url"

## Validation

- Local: tsc, eslint, build.
- Production QA: attributes present on all seven fields; typing/persistence
  unchanged; zero visual diff; R423 unlabeled probe still zero; zero console
  errors; baseline byte restore.
