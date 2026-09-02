# R221 — "Fits the recommended page count" ATS structure check (Builder)

## Evidence (first-party)

Rezi Score guide, Format audits
(https://intercom.help/rezihelp/en/articles/8383527-using-the-rezi-score):

> "Page length - 1-page resumes are best and easy to read for employers, with
> 2-pages recommended only for those in Director or Executive positions who
> have more experience to share."

## Gap

- The Builder length meter (R174) shows fractional length next to the preview,
  but the ATS structure score never checks page count — a 3-page entry-level
  resume can score 100.
- The uploaded-PDF file check "Two pages or fewer" is fixed at 2 regardless of
  seniority and only runs for uploads, not the Builder resume.

## Design

- `pageLengthCheck(pages: number | null | undefined, level: Resume['experienceLevel'])`
  in `src/lib/ats.ts`:
  - `pages == null` (dashboard mini-scores, versions list, first render before
    the debounced measurement lands): guard-pass with a neutral hint saying the
    live PDF preview measures it.
  - Allowed pages: 2 when `experienceLevel === 'executive'` (Rezi: Director or
    Executive), otherwise 1.
  - Fail hint reports the actual page count and the allowance, and points to
    Auto-fit / trimming; executive allowance is mentioned so users know why.
  - Pass hint confirms the count fits the expectation.
  - Anchor `experience` → Priority fixes + "Fix in builder →" deep link.
- `scoreResume(resume, jd, pdfPages?: number | null)` gains an optional third
  argument; Builder passes `pdfLength?.pages ?? null` from the existing
  debounced `usePdfLength` measurement (same number the length meter shows).
  Dashboard/versions callers unchanged (guard-pass).
- Checker (`scoreResumeText`) unchanged — pasted text has no page geometry, and
  uploaded PDFs already have the file-level page check. Rows: checker stays 20,
  Builder 21 → 22 (+1 fix ≈ +4.5 = 100/22).

## Acceptance

1. Builder, entry/mid level, 2-page resume → row fails; hint reports "2 pages",
   1-page expectation, and executive exception; Priority fixes row + deep link
   to Experience.
2. Same resume with experience level Executive → row passes (2 allowed);
   3 pages → fails even for executive.
3. 1-page resume → passes at every level.
4. Before measurement lands (fresh load) → row present and passing (neutral
   hint), no score flicker to fail.
5. Dashboard mini-scores/versions unchanged in shape (guard-pass row included).
6. Checker still 20 rows; no behavior change on /ats-checker.
7. Score arithmetic digit-exact with 22 rows; R218–R220 checks unaffected.
8. 375px no overflow; dark contrast unchanged.
