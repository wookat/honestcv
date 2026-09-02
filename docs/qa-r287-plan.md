# QA — R287 local "Target my job" assistant quick task (prod cv.zalize.com, expect index-DLlSaUNo.js / Builder-CR8NmuTh.js / guidance-RWlsDdyN.js)

Code-traced: guidance.ts targetJobReply 470–496 (no-report guidance, pct head, 100% congratulation,
high/rest lines, triage footer); AssistantPanel.tsx targetJob 236–246 composes user turn
(TARGET_JOB_PROMPT 89–90) + assistant turn synchronously, persistChat → honestcv.assistantChat
(CHAT_KEY 23); runQuickTask 250–252: "Improve my ATS score" + "Target my job" local, "Draft my
summary" → send() → POST /api/ai/assistant (195); findJobs 254–263 local; footer pct line 460–470.
Panel opens via /builder?assistant=1 (Builder.tsx 1110–1119). Oracle strings precomputed via
`npx tsx --tsconfig tsconfig.app.json .tmp-smoke/r287_oracle.ts` using the same resume/JD fixture.

Fixture: resume text mirroring the oracle (name Jane Doe, title Senior Frontend Engineer, bullet
"Built React apps with TypeScript and GraphQL.", skills "React, TypeScript, GraphQL, Jest") and the
oracle JD (Senior Frontend Engineer / React TypeScript GraphQL testing CI/CD pipelines Docker
Kubernetes 5+). Note: matchReport input is resumeToPlainText(resume) — recompute the oracle with the
browser's actual resumeToPlainText output rather than assuming pct=50; assert reply ===
targetJobReply(matchReport(actualPlainText, jd)) recomputed in-page? NO — recompute via tsx oracle
fed with the plain text extracted from the page fixture to keep the oracle independent.
Harness: Fetch interception on *api/ai/* the whole time; any unexpected request = fail.

## W1 Target my job with JD (the feature)
Open /builder?assistant=1 with fixture seeded. Click quick task "Target my job". Assert:
(a) reply appears instantly and is byte-identical to the tsx-oracle output for the same
plainText+JD (recomputed after extracting the page's own resume plain text via the seeded fixture);
(b) ZERO Fetch.requestPaused events for /api/ai/* during the click; (c) free-quota counter text
unchanged before/after. Screenshot of the chat reply.
## W2 Numbers agree with panel footer
Footer line "Target job: N% keyword match · high priority: …" shows the same pct and the same
first high-priority keywords as the reply's head/High-priority line. Screenshot.
## W3 No JD
Clear the JD (Target job panel textarea → ''), click "Target my job" again: instant reply exactly
"You haven’t pasted a job description yet, so there’s nothing to compare against. Open the Target
job panel, paste the posting, and I’ll show exactly which keywords your resume covers and which are
still missing." — no /api/ai request.
## W4 Full coverage
Set JD to "React, TypeScript, GraphQL" (all present in resume): reply is the congratulation form
"Your resume matches 100% of the target job’s keywords (3 of 3). Every keyword the posting asks for
is already on your resume — nice targeting. Give it one last read to make sure each mention
reflects real experience." (exact string via oracle) — no request.
## W5 Regression
(a) "Draft my summary" quick task DOES fire POST /api/ai/assistant — intercept, assert URL, then
failRequest pre-network (error shown, no quota); (b) "Improve my ATS score" and (c) "Find matching
jobs" produce instant local replies with zero requests.
## W6 Persistence + mobile
Reload /builder?assistant=1: previous chat turns still rendered (honestcv.assistantChat).
375×812 with panel open: scrollWidth==375, no horizontal overflow. Screenshots.
## Safety/cleanup
Only /api/ai/* request all round = the single failed W5a; localStorage exactly
["honestcv.clientId","honestcv.qa"] (remove honestcv.resume, honestcv.resumeHistory,
honestcv.assistantChat); empty html class; screenshots /home/ubuntu/screenshots/r287_*.png.
