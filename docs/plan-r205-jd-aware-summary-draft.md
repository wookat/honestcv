# R205 — JD-aware summary drafts

## Rezi first-party evidence

- Rezi public Resume Summary Generator page (`rezi.ai/tools/resume-summary-generator`,
  fetched 2026-08-31): "**Start tailoring your resume summary to the job** — Every facet
  of your resume should be tailored to the individual position you're applying for.
  That includes your resume summary. Simply match your resume to a specific job
  posting, then generate a summary to customize and align it with the needs of the
  role."

## Current RezUp behavior

- The guided summary draft (R163, `/api/ai/summary-draft`) is grounded strictly in
  the resume text + optional highlight chips + target position — it never sees the
  job description, even when the user has a JD pasted in the Target job panel.
- Summary *rewrite* (`buildRewriteMessages`) already tailors toward the JD, but it
  requires an existing summary to rewrite; the from-scratch draft path does not.

## Gap

A user with a JD loaded gets a generic draft summary that ignores the job's
keywords, then must manually run a rewrite/tailor pass. Rezi's public promise is
that the generated summary is aligned with the specific job posting directly.

## Design (prompt/context plumbing only — no new endpoint, schema, or scoring)

1. `worker/prompts.ts` `buildSummaryDraftMessages(resumeText, role, highlights, jobDescription?)`:
   when a JD is provided, append a user-message part: tailor wording toward the JD
   and mirror its keywords **only where the resume truthfully supports them** (the
   existing anti-invention system rules stay).
2. `worker/index.ts` `/api/ai/summary-draft`: accept optional `jobDescription`
   string in the body (trimmed, sliced to 4000 chars) and pass it through.
3. `src/lib/api.ts` `aiSummaryDraft`: optional `jobDescription?: string`.
4. `Builder.tsx` `runSummaryDraft`: pass `resume.jobDescription` (trimmed or
   undefined). Summary-draft setup dialog shows a small note when a JD is loaded:
   "Tailored to your target job's keywords." so the behavior is visible.

## Acceptance criteria

- With a JD loaded, draft candidates reflect JD keywords the resume supports
  (real-call verification); without a JD, behavior identical to today.
- Note appears in the setup dialog only when a JD is present.
- Quota semantics, error paths, JSON-array parsing, language handling unchanged.
- 1440 + 375, dark mode; no other AI endpoints affected.

## Non-goals

- No changes to rewrite/tailor prompts, no new scoring, no schema changes.
