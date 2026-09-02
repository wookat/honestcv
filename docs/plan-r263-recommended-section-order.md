# R263 — Recommended section order for your experience level

## First-party Rezi evidence

- https://www.rezi.ai/rezi-docs/how-to-reorder-resume-sections — "Best Resume
  Section Order … depends on your career timeline":
  - Entry-level ("student, recent graduate, or changing careers without much
    work experience"): "Drag your education section near the top of your
    resume, directly below your contact details and resume objective" and pack
    it with "Relevant coursework".
  - Experienced professional: "Place your work experience section immediately
    below your resume summary … Your education section can follow afterward."
- https://www.rezi.ai/rezi-docs/the-resume-education-section-best-practices —
  "Students and recent graduates can place education near the top, while
  experienced professionals should move it below their work experience
  section."

## Current HonestCV state

- The Builder "Section order" panel supports drag + arrow reordering of
  `orderedSectionKeys(resume)` (Builder.tsx ~5581) but offers zero guidance —
  users must know the convention themselves.
- R262 added the eight-tier `experienceLevel`, so the resume already knows the
  user's career stage; nothing consumes it for layout.

## Design (pure client, zero AI/worker/schema)

New pure helpers in `src/lib/resume.ts`:

```ts
export type SectionEmphasis = 'education-first' | 'experience-first'

/** Rezi reorder-guide recommendation for a selected experience level. */
export function sectionEmphasisFor(level: Resume['experienceLevel']): SectionEmphasis | null
// internship | entry            -> 'education-first'
// associate..executive (6 tiers) -> 'experience-first'
// '' / undefined (Auto)          -> null (no recommendation)

/** Current order with only the emphasis block moved; everything else keeps
 *  its relative order. */
export function recommendedSectionOrder(r: Resume): string[] | null
// null when no emphasis; otherwise take orderedSectionKeys(r) and
//  - education-first: pull ['education','coursework'] (in that order) out and
//    re-insert directly after 'summary'
//  - experience-first: pull ['experience'] out and re-insert directly after
//    'summary'
// Returns null too when the result equals the current order (already
// recommended), so the UI has a single nullable signal.
```

Builder "Section order" panel: when `recommendedSectionOrder(resume)` is
non-null, render a muted hint line —
`Recommended for <level label>: education near the top` (education-first) /
`experience right after the summary` (experience-first) — plus an outline
button `Apply recommended order` that sets `sectionOrder` to the recommended
array (one undoable state update; drag/arrows remain untouched).

## Non-goals

- No auto-reordering on level change; recommendation is opt-in.
- No new persistence keys, no schema change (`sectionOrder` already exists).
- No skills-based layout preset (Rezi itself hedges on it).
- No AI/worker/scoring changes.

## Verification

- tsx oracle: emphasis mapping for all 9 level values; recommended order for
  education-first (education+coursework directly after summary, custom keys
  untouched), experience-first, already-recommended -> null, Auto -> null.
- Production QA: hint + Apply in Builder for entry vs director, no hint on
  Auto, apply persists and preview order changes, drag/arrow regression,
  375px, dark/light contrast, zero AI calls.
