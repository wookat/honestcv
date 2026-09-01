# R170 — Smart link fields: normalize Website/LinkedIn + open-link affordance

## First-hand Rezi evidence (2026-09-01, ~/audit-r1/shots-r170/)
- `05-contact.png`: Rezi's Contact page renders the LinkedIn field as a structured
  input with a fixed `https://linkedin.com/in/` prefix and a link icon on the right —
  users type only the handle, so the stored value is always a clean canonical URL.
  The Personal Website field shows an `https://www.…` placeholder.
- Consequence: Rezi resumes never show `https://www.linkedin.com/in/name/` noise;
  the link is uniform and short.

## Current RezUp behavior (gap)
- `Builder.tsx` Contact section: `website` and `linkedin` are plain text inputs.
  Pasting a full URL (`https://www.linkedin.com/in/jordan-reyes/`) puts the whole
  string verbatim into the preview, PDF/DOCX/TXT/MD exports and the ATS contact line —
  long, noisy, and inconsistent with the `linkedin.com/in/you` placeholder.
- No way to check the link works without copying it into a new tab.

## Design
1. `src/lib/resume.ts`: export `normalizeContactLink(kind: 'website' | 'linkedin', value: string): string`
   - trim; strip a leading `http://` / `https://`; strip a leading `www.`; strip a trailing `/`.
   - linkedin only: a bare handle (no `/`, no `.`) becomes `linkedin.com/in/<handle>`.
   - Empty/whitespace input returns `''`. Never throws; non-URL text passes through.
2. `Builder.tsx` Contact section: for the `website` and `linkedin` fields only,
   - normalize on blur (`onBlur` applies `normalizeContactLink` when it changes the value);
   - show a small external-link icon button after the input when the value is non-empty:
     opens `https://` + value in a new tab (`rel="noreferrer"`), 40px touch target,
     `aria-label="Open <label> in a new tab"`.

## Non-goals
- No schema change (values remain plain strings); no change to `sanitizeResume`,
  imports (`importText.ts`), exports, share, ATS scoring, or AI endpoints.
- No validation errors/red states; non-URL free text is left untouched.
- Email/phone/location unchanged.

## Verification
- Paste `https://www.linkedin.com/in/jordan-reyes/` → blur → `linkedin.com/in/jordan-reyes`.
- Type `jordan-reyes` → blur → `linkedin.com/in/jordan-reyes`.
- Website `https://jordanreyes.dev/` → blur → `jordanreyes.dev`; preview/exports show the clean value.
- Icon opens the right URL in a new tab; hidden when the field is empty; R143 hide toggle unaffected.
- 1440 + 375 viewports; no horizontal overflow; inline preview editing (R136) unchanged.
