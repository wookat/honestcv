# R371 — personalize the follow-up email from data the pipeline already has

## Evidence (production, R371 audit)
- The follow-up draft (`followUpEmail` in `src/lib/jobs.ts`, fully local, zero network) uses only
  job title, company, staleDays, status and the sender's fullName.
- Ignored data sitting on the same entry: notes ("Recruiter: Dana Smith" still yields
  "Hi Acme Corp hiring team,"), the status timeline (interviewing draft never mentions when
  you last spoke), and the linked targeted resume copy (`resumeVersionId` never referenced).
- The dialog says "copy it into your email client" but offers no `mailto:` affordance.
- Banked (not this round): follow-up button only exists in the ≥7d applied/interviewing stale
  window; Copy email swallows clipboard rejection silently; no reminder concept in the pipeline.

## Design (deterministic, zero AI quota)
1. `recruiterNameFromNotes(notes)`: conservative parse of an explicit recruiter mention —
   `recruiter[’s][ name] (:|-|–|—|is) <Name>` where every captured word (≤3) is capitalized.
   Greeting becomes `Hi <FirstName>,`; anything else keeps `Hi <company> hiring team,`.
2. Interviewing opener cites the last timeline step date:
   "It has been N days since we last spoke about the <title> position on <Mon D>…".
   Applied opener unchanged (its date is implied by "N days ago").
3. When the entry has a linked targeted copy (`resumeVersionId`), the middle paragraph becomes
   "I remain very interested in the role — my resume was tailored specifically to this
   position, and I would be glad to share an updated copy or any additional information that
   would be helpful." Otherwise the paragraph is byte-identical to today.
4. Dialog footer gains an "Open in email app" outline button: `mailto:?subject=…&body=…`
   (encodeURIComponent) built from the *edited* draft state.

## Acceptance
- Notes with "Recruiter: Dana Smith" → greeting "Hi Dana,"; notes without a recruiter, with a
  lowercase/garbage value, or absent → greeting unchanged.
- Interviewing draft includes the last-step date; applied draft byte-identical (modulo the
  tailored-copy paragraph rule).
- Entry without resumeVersionId and without recruiter notes → applied draft byte-identical to R368.
- mailto href reflects in-dialog edits; oracle covers name parse + body variants.
- tsc/eslint/build green; production QA at 375 light/dark; R370/R369 regression.
