# R223 — "Strong bullet openers" ATS structure check (builder + checker)

## Evidence (first-party)

Rezi Score guide, Content audits
(https://intercom.help/rezihelp/en/articles/8383527-using-the-rezi-score):

> "Weak bullet points - Make a powerful first impression with the correct
> action verbs to convey your experience and level of impact."

## Gap

- R168 per-bullet guidance flags weak openers ("responsible for", "worked
  on"…) and the R203 writing-quality verb dimension counts them, but the ATS
  structure score never checks bullet openers — a resume where every bullet
  starts "Responsible for…" still scores 100 on structure.

## Design

- Move `WEAK_OPENERS` from `guidance.ts` into `ats.ts` (exported) so guidance
  and the scored check share one list — same pattern as R216's `findPassive`
  migration. List unchanged: responsible for / worked on / helped with /
  helped to / duties included / tasked with / in charge of / assisted with /
  participated in.
- `weakOpenerCheck(lines)` mirrors `activeVoiceCheck`: first bullet whose
  trimmed text starts (case-insensitive) with a weak opener fails; hint quotes
  the opener and the line (60-char truncation) and advises a strong action
  verb (Led, Built, Cut…). Zero-line guard passes. Anchor `experience` →
  Priority fixes + deep link.
- Builder feed: visible experience/project/involvement/custom bullets (same
  as R216/R220). Checker feed: bullet-marker lines (`textBulletLines`).
- Rows: checker 21 → 22, Builder 23 → 24 (fix ≈ +4.5 = 100/22 checker,
  +4.2 = 100/24 builder).

## Acceptance

1. Bullet "Responsible for maintaining the deploy pipeline." → fail quoting
   "responsible for" + the line; Priority fixes row; deep link lands
   Experience.
2. Mid-line occurrences don't trigger ("Led team responsible for billing."
   passes — opener must start the bullet).
3. "Led a team of 8 engineers." and other strong openers pass; zero bullets
   guard-passes; built-in sample passes out of the box.
4. Checker: pasted bullet "- Worked on various tasks." fails this row (and
   independently the R222 filler row via "various"); prose/date headers not
   scanned.
5. Independence from R216 (passive) / R220 (length) / R222 (filler).
6. Score arithmetic digit-exact with 22 checker / 24 builder rows.
7. Guidance wavy-underline behavior unchanged (list identical, now imported
   from ats.ts).
8. 375px no overflow; dark contrast unchanged.
