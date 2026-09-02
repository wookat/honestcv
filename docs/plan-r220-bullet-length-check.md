# R220 — "Bullet points the right length" ATS structure check (Builder + /ats-checker)

## First-party evidence (Rezi)

Rezi User Guides, "Using the Rezi Score" (intercom.help/rezihelp, first Content audit
listed): "**Short bullet points** - Make sure there is enough detail to fully communicate
why it's significant while showcasing your skills and accomplishments - **never too short
and never too long**." The per-bullet real-time analysis on rezi.ai/pricing also lists
"Weak Bullet Points" alongside punctuation/quantification.

## Gap

`guidance.ts` (R168) flags per-bullet length problems inline — `words > 30` → too-long
("aim for under 25"), `words < 4` → too-short — but the ATS structure score never checks
bullet length. A resume of 2-word fragment bullets or 45-word paragraphs scores the same
as one with well-sized bullets and never reaches Priority fixes / deep links.

## Design

New `bulletLengthCheck(lines)` in `src/lib/ats.ts` (same shape as R216/R218/R219):

- Reuse the exact R168 thresholds: a trimmed non-empty line fails when its
  whitespace-split word count is `< 4` (too short) or `> 30` (too long).
- First offender decides the hint; quote the line (60-char truncation) and report its
  word count with direction-specific advice: too short → "describe what you did and the
  result (aim for 8–25 words)"; too long → "N words — tighten to under 25 so it scans".
- Zero lines → guard pass. Anchor `experience` → Priority fixes + "Fix in builder →".
- Builder feed: identical visible feed to R216/R218/R219 (visible experience bullets +
  project/involvement descriptions + custom-section bullets; hidden excluded).
- Checker feed: `textBulletLines(resumeTextRaw)` — bullet-marker lines only; prose,
  headers and date lines never counted; zero markers → guard pass.
- Rows: checker 19 → 20, Builder 20 → 21; each fix ≈ +5 = 100/20 (no-JD formula
  `round(passed/20*100)` unchanged in shape).
- No AI/API/schema/persistence changes; R168 inline guidance and R203 brevity writing
  dimension stay untouched and independent.

## Acceptance

1. "Fixed bugs." (2 words) fails quoting the line; 31+ word bullet fails with word count.
2. Well-sized bullet (4–30 words) passes; boundary 4 and 30 words pass.
3. Hidden entries with bad-length bullets are ignored (Builder).
4. Checker: no-marker prose guard-passes; marker fragment fails.
5. Built-in sample resume still passes (all 6 bullets are 10–17 words).
6. Row counts 20/21; arithmetic digit-exact; fix +5; deep link lands on Experience.
7. 375px no overflow; dark contrast unchanged; R219/R218/R216 regressions green.
8. Zero AI generation calls; localStorage baseline restored.
