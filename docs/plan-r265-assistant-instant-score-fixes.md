# R265: instant local "Improve my ATS score" reply in the assistant

## Rezi evidence (first-party)

- rezi.ai/rezi-docs/ai-resume-agent — the AI Resume Agent's first built-in
  prompt is **Improve My Rezi Score**: "If you choose Improve My Rezi Score,
  the AI reviews your resume and highlights ways to improve readability,
  keyword usage, and ATS performance." It is presented as an always-available
  starting point, before any custom prompting.
- rezi.ai/rezi-docs/the-rezi-score-explained — "Instead of leaving you
  guessing, it gives you instant feedback on your resume … Your Rezi Score
  updates in real time."

## Gap

HonestCV's Resume assistant has an "Improve my ATS score" quick task, but it
is the only built-in task whose answer requires an AI round trip: it consumes
free-quota, fails behind the payment gate, and needs a network call — even
though the app already computes the exact answer locally. `priorityFixes(ats,
health)` (R176/R203) produces the ranked highest-impact fixes with estimated
point impact, and `atsScoreSummary(ats)` summarizes the score. The
"Find matching jobs" quick task (R240) already demonstrates the local-reply
pattern in the same panel.

So a free user with 0 quota clicking the first quick task gets an error,
while the Score breakdown two clicks away shows the answer. That contradicts
Rezi's "instant feedback" positioning.

## Design

- New pure helper `improveScoreReply(score: number, fixes: PriorityFix[]):
  string` in `src/lib/guidance.ts`:
  - With fixes: header `Your ATS score is <score>/100. Highest-impact fixes
    first:` then one numbered line per fix — `1. <text> (~<points> pts,
    <impact> impact)` — and footer `Apply a fix and your score updates
    instantly. The Score breakdown has one-click jumps to each spot.`
  - No fixes: `Your ATS score is <score>/100 — no priority fixes right now.
    Add a job description in the Target job panel and I can point out missing
    keywords too.` (second sentence only when `ats.keywordScore === null`;
    with a JD loaded and no fixes it says `Nice work — ask me anything you'd
    like to sharpen.`)
- `AssistantPanel` gains a `fixes: PriorityFix[]` prop. The existing
  "Improve my ATS score" quick task label is routed (in both quick-task
  render sites) to a local `improveScore()` handler that appends the same
  user prompt plus the locally composed assistant reply — mirroring
  `findJobs()`: no `aiAssistant` call, no quota, chat persisted as usual.
- Builder passes `fixes={priorityFixes(ats, health)}` (memoized on
  ats/health). Reply reflects the shown resume in real time at click time.
- Other quick tasks, custom prompts, and the AI path are unchanged.

## Non-goals

- No worker/schema/persistence/scoring changes; no new AI behavior.
- No deep-link buttons inside chat bubbles (Score breakdown keeps that role).
- Typed free-text prompts still go to the AI — only the quick-task button is
  answered locally.

## QA plan

- tsx oracle: `improveScoreReply` byte-exact for fixes/no-fixes/no-JD forms;
  points/impact ordering matches the Score breakdown's Priority fixes list.
- Production: click quick task from empty state and from the bottom bar with
  a fixture resume → reply matches oracle byte-for-byte and equals the Score
  breakdown top-5; zero `/api/ai/*` calls for the task (fetch capture); other
  quick tasks still hit AI gate; chat persists across reopen; Clear works;
  375px + dark contrast; localStorage restored.
