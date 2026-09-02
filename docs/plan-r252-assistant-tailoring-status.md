# R252 — Assistant synchronized with tailoring progress

## First-party evidence (Rezi)

rezi.ai/rezi-changelog, August 13 (Rezi Web App):

> "Agent State Updates — Your AI Agent now automatically tracks progress based
> on your tailoring completion, ensuring the assistance you receive is always
> synchronized with your current workflow."

Related (August 13, Mobile App): "Instant Job Match Scores — You can now view
your job match score directly within the chat interface, allowing you to
quickly assess how well a role aligns with your profile while you tailor your
application."

## Gap in HonestCV

The Resume assistant greeting card shows only the static ATS structure score
(`ats.score`) and failing checks. The panel claims "I can see your current
draft and target job", but when a job description is loaded the assistant UI
reflects nothing about tailoring progress: no keyword match %, no missing
keywords, and no live update as the user edits. The chat context sent to the
worker includes the JD, but the *interface* is not synchronized with the
tailoring workflow the way Rezi's agent is.

## Design

Purely local + presentational; zero AI, zero worker/schema changes.

In `AssistantPanel`, reuse R251's `matchReport(resumeToPlainText(resume),
jobDescription)`:

- New prop-free derivation inside the component (props `resume` and
  `jobDescription` already exist and re-render live as the Builder edits).
- Greeting card (turns.length === 0): below the ATS score block, when a report
  exists, add a "Target job" block:
  - `Your resume matches N% of the target job's keywords (X of Y).`
  - If `highPriorityMissing.length > 0`:
    `High priority to work in: a, b, c` (first 3, amber, same tone as R250).
  - Else if `missing.length > 0`: `Still missing: a, b, c` (first 3, muted).
  - Else: `All job keywords covered — nice tailoring.` (emerald).
- When a chat exists (turns.length > 0): a compact one-line status strip above
  the quick-task chips: `Target job: N% keyword match` (+ ` · high priority:
  a, b` when applicable), so the assistant stays synchronized mid-conversation
  and updates live after Apply actions change the draft.
- No JD loaded or empty draft → nothing renders (both states unchanged).

## Invariants / non-goals

- `matchScore`/`matchReport` untouched; percentage identical to the Target job
  panel and /jobs (same helper).
- No new persistence; no chat schema change; no AI calls or prompt changes.
- R227–R230 proposal cards, R240 Find-jobs card, quota flows unchanged.

## Validation

1. JD loaded + missing HP keywords: greeting block and status strip show the
   oracle-exact %, counts and first-3 HP keywords; equals Target job panel %.
2. Apply an assistant/summary edit adding a missing keyword → % and lists
   update live without reopening the panel.
3. No JD → neither block renders (byte-identical greeting to R251 baseline).
4. Empty draft → no block; all-covered → emerald line, no keyword list.
5. Regression: quick tasks, Find matching jobs, proposal Apply/locate, clear
   chat; 375px; dark-mode contrast ≥4.5:1 (beware inverted amber palette —
   use `text-amber-800`-style tokens, no `dark:` text override).
6. Zero `/api/ai/*` completion calls; localStorage cleanup to baseline.
