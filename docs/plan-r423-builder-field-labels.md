# R423 (SOP-10 node) — accessible names for placeholder-only Builder fields

## Production evidence (CDP probe @1280, https://cv.zalize.com)

- SOP-10 sweep across /dashboard /builder /jobs /documents /samples /ats-checker:
  titles/h1s correct, zero images without alt, zero unnamed buttons, zero
  duplicate ids, lang=en. Only gap: /builder has visible form fields whose only
  name is a placeholder — 7 flagged on the default resume (summary textarea,
  experience/education end dates, GPA, Minor, Details), and source shows the
  same pattern in Projects/Involvement/Military date pairs (6 more).
- Placeholder-only fields fail WCAG 1.3.1/4.1.2: screen readers have no
  accessible name once a value is typed (placeholder disappears), and
  placeholders are not reliably announced as names.
- Sibling fields are already labeled (Label htmlFor on start dates for
  experience/education, aria-label on every icon button) — these fields were
  simply missed.

## Scope

- MonthYearField: new optional `ariaLabel` prop forwarded to the inner Input.
- Builder.tsx: aria-labels on the unlabeled fields only; no visual changes,
  no markup or layout changes beyond the attribute.

## Implementation

- Summary textarea: aria-label="Professional summary".
- Experience/education end dates: ariaLabel="End date".
- Projects/Involvement/Military date pairs: ariaLabel="Start date"/"End date".
- GPA / Minor / Details education inputs: aria-label "GPA (optional)",
  "Minor (optional)", "Education details (optional)".
- Round 2 (QA found 12 more once optional sections mounted; static scan found
  the rest): aria-labels on every remaining placeholder-only field — Projects
  (name/link/org/description), Involvement (role/org/college-city/description),
  Military (rank/branch/stationed/description), Coursework, Awards,
  Publications, References, Agents, Certifications, Custom sections, the
  import-paste textarea and generated-letter textarea.
- Round 3: Import dialog "Share link or share ID" input.

## Validation

- Local: tsc, eslint, build.
- Production QA: unlabeled-field probe returns zero on /builder with all
  optional sections rendered; AX tree names present; zero visual diff;
  typing/date-picker behavior unchanged; R421/R422 skip-link regression.
- Final result (Builder-Cc_mvfKF.js): probe zero with every optional section
  mounted via the UI and with the Import dialog open; AX computed names
  confirmed (e.g. Course name, Certificate name, Reference email, Share link
  or share ID); zero console errors, zero unsafe traffic, baseline byte-exact.
