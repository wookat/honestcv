# QA plan — R258 session feedback report (production: cv.zalize.com)

Feature: finishing an interview practice session ("Practice all N" → Finish
session, or "Finish & get transcript") now prepends a deterministic local
"Session report" block to the transcript: scored count, average practice score,
per-question scores (`Q1 46/100 · …`), and — when the target JD yields keywords —
a session-wide keywords report (`Keywords covered across the session: … (X of Y)`,
`High Priority Words still missing: …`, `Remaining Keywords still missing: …`,
cap 8 + `+N more`, tiers omitted when empty). Answers under 10 words are not
scored. All-skipped sessions produce no report (transcript byte-identical to
pre-R258). Bundle: index-CTkkToPS.js / Builder-Du-mY6vF.js.

Checks:
- F1 Full session with JD: seed resume with target role/JD, run Practice-all
  from R257 Instant questions, answer ≥2 questions with fixed answers, skip one;
  finish; assert the whole result text byte-matches a tsx oracle
  (`sessionReport` + existing transcript format).
- F2 No-JD session: score lines only, no keywords section (oracle).
- F3 All-skipped session: no report; transcript matches pre-R258 format exactly.
- F4 Short answer (<10 words): counted in N, not scored.
- F5 ignoredKeywords excluded from the keywords report.
- F6 Per-answer live analysis (R250 tiers, R256 resume-gap row, R257 instant
  questions, delivery/tone metrics) regression — unchanged.
- F7 Copy/download/save-to-documents of the result includes the report.
- F8 375px: result area no horizontal overflow.
- F9 Light/dark contrast on the result block; zero /api/ai/* completions;
  restore localStorage baseline ["honestcv.clientId","honestcv.qa"] and light theme.

## Results (appended after production QA)

- Bundles index-CTkkToPS.js / Builder-Du-mY6vF.js verified live.
- F1 full session (answer q1 long, q2 short 4 words, skip q3–q5, q6 long → Finish): whole result **byte-exact** vs tsx oracle — "Practice session — Platform Engineer at Globex\n3 of 6 questions answered", "Session report\nScored 2 of 3 answers · average practice score 50/100\nQ1 46/100 · Q3 54/100\nKeywords covered across the session: terraform, kubernetes, python, grafana (4 of 8)\nHigh Priority Words still missing: platform, engineer, globex, 5+" + transcript — passed
- F2 no-JD session: byte-exact, score lines only, no keywords section — passed
- F3 all-skipped: byte-exact "…\n0 of 6 questions answered\n\n" — no "Session report" (pre-R258-identical shape) — passed
- F4 short answer (<10 words, 4 words): counted in "3 of 6" and transcript Q2, excluded from "Scored 2 of 3" — passed (within F1)
- F5 ignoredKeywords ["kubernetes"]: byte-exact vs oracle; kubernetes absent from the report block — passed
- F6 regression mid-session: score 46/100 === oracle, "Instant · local — no AI used", STAR chips, R250 tier line, R256 gap line, tone, timer button — passed
- F7 "Save to My resumes" → honestcv.careerDocs entry "Platform Engineer — Interview prep" text byte-equal to result; button flips to "Saved — update"; PDF/DOCX buttons present — passed
- F8 375×812 full flow: scrollWidth 375 with result rendered — passed
- F9 result textarea rendered-pixel contrast light 18.29:1 / dark 15.83:1; __aiReqs [] throughout; final localStorage ["honestcv.clientId","honestcv.qa"], light theme — done
