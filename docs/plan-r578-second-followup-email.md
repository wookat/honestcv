# R578 (SOP-10 round) — Second follow-up drafts acknowledge the first follow-up

## SOP-10 four-dimension re-scan
7 routes × 1280/375: zero horizontal overflow, zero console errors. No P0–P2 in the scan; gap picked from
workflow depth.

## First-hand production evidence (CDP, cv.zalize.com)
- Seed: applied 10 days ago, `followedUpAt` 2 days ago (post-R576 state).
- Open "Draft follow-up email": body reads "I applied for the Senior Engineer position 10 days ago and
  wanted to follow up on the status of my application." — identical to a first-touch email. The recorded
  follow-up from 2 days ago is ignored, so the user would send a repeat email pretending they never
  followed up.

## Competitor comparison
Rezi-class follow-up generators vary the message by touch count (first follow-up vs. check-in). Our data
already knows a follow-up happened (`followedUpAt`); the draft just doesn't use it.

## Fix (minimal, one file)
`src/lib/jobs.ts` `followUpEmail`: when `entry.followedUpAt` is set and later than the last status change,
the applied/interviewing openers become a check-in that names the prior follow-up date, e.g.
"I applied for the {title} position {when} and followed up on {date}; I wanted to check in again on the
status of my application." Offer thank-you flow unchanged. No storage or UI changes.

## Validation / deploy / QA
tsc, eslint (jobs.ts), build, verify-dist; `npx wrangler deploy` (known Routes auth code 10000 caveat).
Production QA 1280/375: post-follow-up draft names the follow-up date; entry without followedUpAt keeps the
original wording; offer flow unchanged; zero overflow; six-key storage baseline restored; zero AI quota.
