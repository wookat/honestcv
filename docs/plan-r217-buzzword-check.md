# R217 — "No empty buzzwords" ATS structure check (Builder + /ats-checker)

## Rezi first-hand evidence

Rezi's "Using the Rezi Score" user guide (intercom.help/rezihelp, one of the 23
audits, Content category):

> "Buzzwords - Trendy terms or phrases in resumes can make job seekers sound
> generic and unoriginal, failing to effectively highlight their unique skills
> and qualifications."

## Gap in HonestCV

`checkBullet` (guidance.ts) has flagged buzzwords per bullet since R168, and
the R203 writing-quality report has a buzzwords dimension, but the ATS
structure score in both paths never checks them — a summary stuffed with
"team player, results-driven self-starter" scores identically to a concrete
one, and buzzwords never reach the deep-linked Priority fixes on /ats-checker
(the writing-quality dims are Builder-derived and explicitly not part of the
ATS score there).

## Design

New structure check `No empty buzzwords` in `src/lib/ats.ts`, same shape as
R211's pronoun check (segment list with per-segment anchors).

- Scored list = the clearly-empty claims only: `synergy`, `go-getter`,
  `think outside the box`, `team player`, `hard worker`, `detail-oriented`,
  `results-driven`, `self-starter` (word-boundary, case-insensitive).
  The ambiguous single adjectives from guidance's full list (`dynamic`,
  `proactive`, `passionate`, `motivated`) are deliberately excluded from the
  *scored* check — "dynamic programming", "passionate about accessibility"
  are legitimate resume content and a scored check must not false-alarm.
  Per-bullet guidance keeps flagging the full list unchanged.
- `buzzwordCheck(segments: {text, anchor}[])`: first matching phrase fails;
  hint quotes the phrase and tells the user to replace it with a concrete,
  checkable fact. Anchor = the matching segment's anchor.
- Builder (`scoreResume`): segments = summary (anchor `summary`) + visible
  experience bullets / project & involvement descriptions / custom-section
  bullets (anchor `experience`) — the same feed as the R211 pronoun check.
- Checker (`scoreResumeText`): reuse `textPronounSegments` (split at the
  experience heading: head → `summary`, tail → `experience`; no heading →
  whole text as `summary`).
- Denominators shift by design: checker 16 → 17 checks, Builder 17 → 18
  rows. Scoring formula unchanged; enters Priority fixes + the
  "Fix in builder →" deep link automatically.
- No AI, API, schema, or persistence changes; only `src/lib/ats.ts`.

## Acceptance

- Builder: summary "Results-driven team player…" fails with the phrase
  quoted and deep link to Summary; bullet "Team player who shipped X" fails
  with anchor Experience; removing the phrases passes. Hidden entries
  ignored.
- Checker: pasted text with "self-starter" in the summary paragraph fails
  (anchor summary); the same phrase below the Experience heading anchors to
  experience; text without any scored phrase passes.
- Negative: "dynamic programming", "passionate about mentoring" never fail
  the scored check (still underlined per-bullet by guidance).
- Arithmetic: no-JD checker score = round(passed/17·100); each fix +100/17
  ≈ 5.9. Builder breakdown 18 rows.
- 375px, dark mode, and R216/R214/R211 regressions unchanged.
