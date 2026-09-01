# R185 — Preselect the most suitable experience entry for a keyword bullet

## Evidence (verified public Rezi surface)
Rezi public changelog, Updates May 2024, "AI Keyword Tailoring":
"To create an optimized bullet point, you just need to indicate if the missing
keyword is relevant. Rezi will autogenerate a bullet point in the most suitable
work experience entry for your consideration."
(https://www.rezi.ai/rezi-changelog, fetched 2026-09-01. The protected app is
inaccessible — OTP 403 — so Rezi's internal selection algorithm is unknown; we
only take the public behavior: the bullet lands in the most suitable entry,
not simply the first one.)

## Current gap
Our KeywordBulletDialog (R154 triage "Yes — draft a bullet" and the chip
micro-button) drafts a grounded bullet, but the "Add to" select always defaults
to `resume.experience[0]`. With several roles, the user must know which entry
fits the keyword and re-pick every time; the "most suitable entry" half of the
Rezi flow is missing.

## Design (local, deterministic, zero AI change)
- `src/lib/ats.ts`: new pure `bestExperienceForKeyword(entries, keyword, jd)`:
  entries = `{ id, text }` (role + company + companyInfo + bullets, hidden
  entries excluded by the caller). Score per entry:
  - +3 per keyword token occurrence in the entry text (phrase keywords also
    checked with `includes`),
  - +1 per other JD keyword (from existing `extractKeywords(jd)`) present in
    the entry text (context fit),
  - tie → earlier entry (resume order, most recent first by convention).
  Returns the best entry id, or null when entries is empty.
- `KeywordBulletDialog`: initialize `expId` from `bestExperienceForKeyword`
  (fallback: first entry); the matching option label gets a " — best match"
  suffix, and a muted hint line explains the preselection ("Preselected the
  role that best matches this keyword — change it if you disagree").
- Hidden experience entries are excluded from scoring but stay selectable in
  the dropdown (unchanged options list).
- No worker/AI/prompt changes; the AI keeps receiving the whole resume text.

## Acceptance
1. Resume with 2+ experiences where the keyword clearly matches the 2nd entry
   (e.g. keyword "kubernetes" appears in entry 2's bullets): dialog opens with
   entry 2 preselected and labeled " — best match".
2. Keyword matching no entry: falls back to JD-context fit; if all zero, first
   entry preselected (no crash, no label change requirement).
3. User can still change the select; Add bullet inserts into the chosen entry.
4. Hidden entries never become the preselection.
5. 1440 + 375 layout unchanged; R154 triage flow and chip button both open the
   dialog with the new preselection; R168/R169/R183/R184 smoke intact.
