# R104 — Experience level on the target job (grounds every AI draft)

## First-hand evidence (2026-08, logged-in Rezi)
- `~/audit-r1/shots-r104/settings-full.png`: the editor's Settings ("Update your
  resume") dialog carries an **EXPERIENCE** dropdown (value "Internship") right
  under the resume name, next to the Target-your-resume job fields — Rezi keeps
  a per-resume seniority level and feeds it to its AI.
- Same round: `shots-r104/job-search.{png,txt}` re-audited the Rezi Job Search
  pipeline — stages Saved/Matched/Applied/Interviewing/Rejected; ours already
  covers Saved/Applied/Interviewing/Rejected ("Matched" is Rezi's paid AI
  matching, previously rejected). `shots-r104/ai-interview.txt`: AI Interview is
  a session-based mock-interview product; our Interview Prep (R26/R27 practice
  questions + AI feedback) covers the free core; full mock-interview flow is a
  large multi-round feature, deferred, not silently dropped.

## Gap
Our Target job section has role + JD only. Every AI draft (summary candidates,
suggest-a-bullet, tailor, keyword bullets, assistant) writes the same register
for an intern and a VP — e.g. "Suggest a bullet" for a junior role happily
drafts leadership-scope achievements. Rezi grounds its AI in the stored level.

## Design
1. `Resume.experienceLevel?: '' | 'internship' | 'entry' | 'mid' | 'senior' | 'executive'`
   — optional enum, absent/legacy = '' (Auto), sanitizer whitelists and falls
   back to ''.
2. Builder Target-job section: a small "Experience level" select (Auto +
   the 5 levels) beside Target role.
3. One client-side helper `aiTargetRole(resume)` returns
   `"<targetRole> (<level> level)"` when a level is set, else the plain role,
   and replaces `resume.targetRole` at every AI call site (Builder ×9,
   AssistantPanel ×1). Prompts already print `Target role: …`, so the level
   reaches every existing endpoint with zero worker/API changes.

## Non-goals
- No worker/prompt/endpoint changes, no new quota semantics.
- No effect on ATS scoring, guidance rules, or exports.
- Rezi's Matched pipeline stage / AI Interview product (see above).
