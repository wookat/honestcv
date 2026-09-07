# R525 — Loading a role example keeps the target job

## First-hand production evidence (2026-08-31, fresh storage, CDP)

1. /jobs → select job (Freelance Copywriter — Coalition Technologies) → "Target my resume" →
   "Start my resume for this job" (R524 flow). Draft after landing on /builder:
   `targetRole=Freelance Copywriter | targetCompany=Coalition Technologies | jobDescription=2783 chars`.
2. The first-run wizard ("How do you want to start?") opens. Picking a role in
   "Start from a role example" loads the example and the draft becomes:
   `targetRole=Freelance Copywriter | targetCompany= | jobDescription=0 chars`.
   The target job the user aimed at seconds earlier is silently gone (targetRole only
   survived because the wizard re-sets it from its own state; the empty-state role
   picker outside the wizard wipes all three).

## Root cause

`replaceWithExample()` in `src/pages/Builder.tsx` builds the new draft from
`exampleToResume(person)` (which starts from `emptyResume()` — empty target fields)
and only preserves a deliberately-picked `templateId`. R368 already established the
product rule "importing content keeps the target job" for paste/upload import; the
role-example path predates it and was missed.

## Fix (smallest useful)

In `replaceWithExample`, preserve the current draft's target job when set:

```ts
...(cur.targetRole ? { targetRole: cur.targetRole } : {}),
...(cur.targetCompany ? { targetCompany: cur.targetCompany } : {}),
...(cur.jobDescription ? { jobDescription: cur.jobDescription } : {}),
```

All example entry points share this helper (wizard select, empty-state role picker,
?example deep link, pending-example confirm), so they all inherit the fix.

## Non-goals

- No change to the replace-confirm rules (`applyExample` still confirms only when
  the draft has a name/summary).
- No change to exampleToResume, import paths, or the wizard flow.
- No automatic content generation.

## Verification

- tsc, focused eslint, build, verify-dist.
- Production QA (desktop + 375px): R524 empty-target flow → wizard role example →
  target trio intact + ATS panel aims at the job; ?example deep link with a
  targeted draft keeps the target; example load with no target unchanged (empty
  target stays empty); console-error hook; storage cleanup.
