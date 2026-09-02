# R193 — Per-status "Next step" guidance in the job detail pane

## First-party evidence

Rezi public changelog, August 13, 2026 (Rezi Web App):

> "Agent State Updates — Your AI Agent now automatically tracks progress based on your
> tailoring completion, ensuring the assistance you receive is always synchronized with
> your current workflow."

Rezi's agent surfaces the next relevant action based on where the user is in the
tailoring/application workflow. Our /jobs detail pane shows status buttons, tailoring
progress (R188), the timeline (R190) and notes, but never tells the user what to do
next — after saving a job the user must figure out on their own that they should tailor
the copy, then apply, then prepare for the interview.

## Gap

For a tracked job we already know everything needed to recommend the next action
locally (status + R188 tailored keyword match + linked targeted copy), but we render
no recommendation. Rezi keeps its assistance synchronized with workflow state; we don't.

## Design (local-first, zero AI)

In the detail pane's tracked-entry card (above the Application timeline), add a single
"Next step" row computed deterministically from the pipeline entry:

| State | Recommendation | Action |
|---|---|---|
| tracked, no surviving targeted copy | Create a resume targeted at this job | existing Target flow (confirm dialog) |
| saved, copy match < 80% | Improve your targeted copy — NN% keyword match | open targeted copy in editor |
| saved, copy match ≥ 80% | Your copy is well tailored — apply on site | job's external apply URL |
| applied | Prepare for the interview | `/builder?doc=interview` deep link (target job set on draft, same as cover path) |
| interviewing | Practice interview questions before the next round | same interview deep link |
| rejected | Keep momentum — search for similar roles | set the search query to the job title and rerun the search |

Rendering: one compact row — `Next step:` label + short text + a small inline action
button reusing existing button styles (min 40px touch target on mobile, `sm:min-h-8`
desktop). Untracked jobs show nothing (the pane already offers Target/Cover/Apply).

The interview deep link reuses Builder's existing `?doc=interview` handling and sets
`targetRole/targetCompany/jobDescription` on the current draft first (same semantics as
the existing cover-letter path), so the interview tools aim at this posting.

## Non-goals

- No AI call is made by this feature itself (the interview tools remain user-invoked).
- No schema/storage change: everything derives from existing pipeline + versions state.
- No scoring changes; reuses the R188 `tailoredMatchOf` map and its 80% threshold.

## Acceptance

- Each of the six states above shows exactly the specified recommendation and action.
- Actions work: Target opens the confirm dialog; Improve opens the targeted copy;
  Apply opens the posting; interview links land on /builder with the interview tool
  open and the draft's target job set; rejected reruns the search with the job title.
- Untracked jobs show no Next step row; R188/R190/R191/R192 behavior unchanged.
- 1440 + 375px, dark mode, no horizontal overflow, ≥40px touch target on mobile.
- Zero AI quota consumed during QA.
