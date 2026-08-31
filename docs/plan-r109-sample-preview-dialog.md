# R109: full-size sample preview dialog on the dashboard

## First-hand evidence (Rezi, 2026-08)

- `app.rezi.ai/dashboard/samples/library` (audit shots-r109/samples.png): the
  Sample Library pairs the category list with a large **PREVIEW** pane showing
  the complete, readable sample resume (full contact line, every experience
  bullet, projects, skills) *before* the user commits to using it.
- Our dashboard Sample library (R8/R51) renders each sample as a 176px-tall
  thumbnail at `zoom: 0.35` — decorative, not readable. The only action is
  "Use this example", which navigates to `/builder?example=<slug>` and asks to
  replace the current draft. Users cannot read a sample's actual content
  before that commitment; the static `/examples/` pages exist but are a
  context switch away from the workspace.

## Gap

Rezi: inspect the full sample in place, then decide. Us: decide blind from a
35%-zoom thumbnail or leave the dashboard.

## Design

Client-only, `Dashboard.tsx` only:

- Make each sample card's thumbnail/title area a button that opens a preview
  dialog (`previewExample: ExampleEntry | null` state).
- Dialog: sample role + sector in the header, a scrollable full-size
  `<ResumePreview resume={exampleToResume(person)} />` body, and a footer
  with "Use this example" (navigates to the existing
  `/builder?example=<slug>` flow, which keeps its replace-draft confirm) and
  Close.
- Reuse the existing `Dialog` primitives; no new deps, no schema, no AI, no
  storage, no scoring changes. `/examples/` static pages untouched.

## Non-goals

- No Rezi-style persistent side pane (our dashboard is a card grid, a modal
  fits the existing IA).
- No sample "save" list, no PRO gating (all our samples stay free).
