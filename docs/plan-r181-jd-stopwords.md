# R181 — JD keyword extraction: filter hiring-boilerplate words

## Evidence (first-hand, 2026-09-01)

R180 production QA on cv.zalize.com: a JD phrased "We need a platform engineer…"
made `extractKeywords` surface **"need"** as a top JD keyword. It appeared under
"Still missing" in the new tailoring report and counted in the ATS keyword
denominator — telling the user their resume should contain "need". The same
class of noise applies to hiring-ad boilerplate generally (seeking, hire,
opportunity, candidates, passionate…), which appears with high frequency in
almost every JD but never denotes a skill worth matching. Rezi's public
Resume Keyword Scanner surface markets skill/title keyword targeting, not
recruiting filler.

## Current behavior

`STOPWORDS` in `src/lib/ats.ts` already filters English function words and a
first batch of JD filler (`work job candidate ideal role position…`), but the
list predates real-JD QA fixtures and misses common hiring-ad verbs/nouns.
Frequency ranking then promotes whatever repeats twice.

## Change

Extend `STOPWORDS` only (no extractor logic change, no scoring formula change)
with hiring-boilerplate words that never denote a matchable skill:

- hiring verbs: need needs needed want wants seek seeking hire hiring offer
  offers offering
- audience nouns: candidates applicant someone person people employees staff
- ad filler: opportunity opportunities career mission culture location office
  schedule compensation pay perks package eligible employment
- generic qualifiers: key core top best right related relevant similar many
  multiple several various successful proven passionate motivated driven
- time units already partly covered: add day days week weeks month months

Deliberately NOT filtered: domain-meaningful words (degree, security, design,
support, data…) and anything that can be a real skill/title token.

## Effects

- Fewer junk keywords → matched/missing lists and keyword denominators change
  slightly for JDs containing these words; the formula is untouched.
- Applies everywhere `extractKeywords` is used: Target job card, ATS checker
  page, R180 tailoring report, keyword triage.

## Acceptance

- Headless check: JD "We need a platform engineer… seeking candidates…"
  no longer yields need/seeking/candidates; real skills (kubernetes, terraform,
  aws) still extracted with unchanged ranking.
- Lint/typecheck/build green; production QA: Target job keyword list and
  tailoring report show no boilerplate chips; R180/R176 smoke intact.
