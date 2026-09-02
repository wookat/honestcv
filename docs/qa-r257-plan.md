# QA plan — R257 instant local interview questions

Production: https://cv.zalize.com — bundles `index-BzCrXK5B.js` / `Builder-D9pBz8jk.js`.

## Feature

Interview practice tool ( /builder → Interview prep → practice card): new
"Instant questions" button next to the AI "Suggest questions" button. Synchronous,
zero AI: `localInterviewQuestions(resume)` (src/lib/interviewAnalysis.ts) composes,
capped at 6, in order:

1. Opener — `Walk me through your background — why are you a fit for the <targetRole>
   role at <targetCompany>?` (no role → generic "what kind of role are you looking for
   next?"; no company → drop " at <company>").
2. Up to 2 from the first two visible (`!hidden`) experience entries with non-empty
   role: `Tell me about your time as <role> at <company>. What result are you most
   proud of from that role?` (no company → drop " at <company>").
3. Up to 2 JD high-priority keywords (extractKeywords → highPriorityKeywords filter,
   extraction order): `This role emphasizes <kw>. Describe a specific project where you
   used it and what the outcome was.`
4. Closer — `Tell me about a time something went wrong at work. What did you do, and
   what changed afterwards?`

The list feeds the existing `suggested` state — pick-one buttons and
"Practice all N" reuse the existing session flow unchanged.

## Checks

- F1 oracle: full fixture (role+company, 2+ visible experience, JD with ≥2 high-priority
  keywords) → 6 questions byte-exact vs tsx oracle, order fixed.
- F2 no JD → 4 questions (opener + 2 experience + closer), no keyword questions.
- F3 hidden/empty-role experience skipped; empty resume → opener(generic) + closer.
- F4 no targetCompany → opener drops " at …".
- F5 "Practice all 6" session works: per-question advance, transcript save; pick-one
  buttons fill the question input.
- F6 AI "Suggest questions" path unchanged (still quota-gated); practice score math
  unchanged (byte-identical for a fixed answer).
- F7 regressions: R201 instant analysis, R233 timer, R234/R235 fillers, R236 tone,
  R250 tiers, R256 resume-gap line.
- F8 375×812: buttons wrap without overflow (scrollWidth 375).
- F9 light/dark contrast ≥4.5:1 for the new button; zero /api/ai/* completions;
  restore localStorage baseline ["honestcv.clientId","honestcv.qa"] + light theme.

## Results

(appended after the production run)

## Results (production run, bundles index-BzCrXK5B.js / Builder-D9pBz8jk.js verified live)
- F1 full fixture: "Instant questions" → 6 questions byte-exact vs tsx oracle in fixed order (opener with role+company; Senior DevOps Engineer at Initech; Site Reliability Engineer with company clause dropped; "This role emphasizes platform." + "…engineer."; closer). Empty-role and hidden entries skipped; third visible entry excluded (slice 0,2) — passed
- F2 no JD → exactly 4 questions (no keyword questions), byte-exact — passed
- F3 empty resume → 2 questions (generic opener + closer), byte-exact; "Practice all 2" renders — passed
- F4 no targetCompany → opener "…for the Platform Engineer role?" (no " at …"), rest byte-exact — passed
- F5 pick-one fills the question input byte-exact; "Practice all 6" → "Question 1 of 6" with q1, typed answer scored, "Next question" → "Question 2 of 6" with q2 — passed
- F6 AI "Suggest questions" button still present beside "Instant questions" (["Suggest questions","Instant questions"]); not clicked (zero-AI round). Practice score 46/100 === analyzeAnswer oracle — passed (presence-only for the AI path)
- F7 regression: score + "Instant · local — no AI used", words line, STAR chips, R250 tier "High priority: platform, engineer, globex, 5+, kubernetes", R256 gap line ("…you used terraform… it's not on your resume yet."), tone line, "Start 2-minute window" button — passed (Pace line absent for the 18-word answer — expected, delivery gated on length)
- F8 375×812: scrollWidth 375 with 6 questions rendered — passed
- F9 "Instant questions" button rendered-pixel contrast: light 18.29:1, dark 15.83:1; __aiReqs [] throughout; final localStorage ["honestcv.clientId","honestcv.qa"], light theme — done
