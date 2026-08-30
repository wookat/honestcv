# R64: mark missing JD keywords as "not relevant"

## Evidence (first-hand, ~/audit-r1/shots-r64/)
- `rezi-editor-finishup.png`: Rezi's Finish Up sidebar has an "AI Keyword Targeting"
  panel — "Is this missing keyword relevant to your experience? [React]" with two
  actions: "YES - ADD BULLET POINT" and "NO". The NO path lets the user declare a
  posting keyword irrelevant and move on.
- RezUp production: the Missing keyword chips (score details) offer "+ add to Skills"
  and "AI draft a bullet" — the YES path is covered (R1/R3), but there is no NO path.
  A keyword the user genuinely doesn't have (and shouldn't fake) stays in Missing
  forever and permanently drags keyword coverage, nudging users toward keyword
  stuffing — the opposite of the honesty positioning.

## Scope
1. `Resume` gains `ignoredKeywords: string[]` (sanitized like other string arrays).
2. `scoreResume` excludes ignored keywords (case-insensitive) from the extracted
   keyword list — they count in neither matched, missing, nor the coverage
   denominator. `AtsResult` gains `ignored: string[]` (the excluded ones present in
   this JD) so the UI can show and restore them.
3. Builder score details: each Missing chip gets a ✕ "Not relevant" action; an
   "Excluded (N)" row lists ignored keywords with one-click restore. Score
   explanation discloses the exclusion when any keyword is ignored.
4. Text path (`scoreResumeText` / ats-checker page) unchanged — no persistence there.

## Non-goals
- Rezi's proactive one-keyword-at-a-time wizard next to the preview (our chips
  already expose all keywords at once; a wizard adds flow complexity without new
  capability).
- Auto-suggesting which keywords to ignore (user judgment only — anything else
  would be the tool endorsing score manipulation).

## Acceptance
- Marking a missing keyword not-relevant removes it from Missing, adds it to
  Excluded, and recomputes coverage without it (score can only rise or stay).
- Restore puts it back into the pool immediately.
- Choice persists via `honestcv.resume` and survives reload; sanitize keeps it.
- Explanation text discloses exclusions. 1440+375 no overflow, console clean,
  localStorage restored after QA.
