# R245 — Repeated skills across tracked jobs

## Evidence (Rezi public surface, first-party)

Rezi Job Search user guide (https://www.rezi.ai/rezi-docs/job-search):

> "Instead, use Rezi Job Search to spot common themes across job descriptions. As you
> save jobs, you'll probably notice repeated skills, responsibilities, and ATS
> keywords. Maybe three different positions all ask for negotiation, analytics, and
> campaign reporting. That's your sign to create a resume version tailored to that
> type of role."

Rezi frames repeated skills across saved jobs as the trigger for building a tailored
resume variation. HonestCV has all the raw ingredients — per-job skill tags since
R244, a tracked pipeline since R191–R196, per-job targeted copies since R183 — but
nothing surfaces the cross-job pattern: the user would have to open every tracked job
and eyeball the tag rows themselves.

## Current state

- `/jobs` Tracked tab (R196) shows the whole queue grouped by status; no aggregate
  view of any kind.
- `JobListing.tags` (R244) carries up to 24 deduped upstream skill tags per job; jobs
  tracked before R244 have no `tags` field.
- The R243 skills filter matches `title\ndescription\ntags` with word-boundary,
  case-insensitive, escaped-literal semantics; R244 chips toggle terms via
  `toggleSkillTerm` (switches to the All tab).
- The resume draft is already loaded on /jobs (`resumeText` memo, used for match %).

## Design

A "Repeated skills" strip at the top of the Tracked tab list column, shown only when
at least one tag appears on **two or more distinct tracked jobs**:

- Aggregation: count each tag at most once per tracked job, case-insensitively
  (canonical casing = first occurrence). Keep tags with count ≥ 2, sort by count
  desc then alphabetically, cap at 12 chips.
- Each chip renders `<tag> ×<count>`, and — following Rezi's "that's your sign to
  tailor" framing — marks whether the skill is already on the user's resume: chips
  whose tag fails the R243 word-boundary regex against the resume text get an amber
  "missing" dot + title explaining it's not found on the resume yet.
- Clicking a chip calls the existing `toggleSkillTerm` (adds the term to the skills
  filter and switches to the All tab) so the user can immediately browse more jobs
  asking for that skill. `aria-pressed` mirrors filter membership like R244 chips.
- Jobs without tags (tracked pre-R244, or upstream tag-less) simply contribute
  nothing; with < 2 shared tags the strip does not render at all.

Pure client-side derivation from existing state: no worker, schema, scoring, AI, or
persistence changes. Session-only UI.

## Validation matrix

1. Two tracked jobs sharing `react` (different casing) → one `react ×2` chip.
2. Tag on a single tracked job only → not shown; zero shared tags → no strip.
3. Count is per-job: duplicate tag within one job's tags never inflates the count.
4. Sort: count desc, ties alphabetical; > 12 shared tags → capped at 12.
5. Resume containing "React" → no missing dot on `react ×2`; skill absent from the
   resume → amber dot + explanatory title (word-boundary: resume "JavaScript" must
   NOT satisfy a `java` chip).
6. Chip click → All tab with the term in the skills filter; click again from the
   Tracked tab removes it (dedupe, case-insensitive) — same semantics as R244.
7. Tracked jobs with no `tags` field (legacy) → no crash, excluded from counts.
8. 375 px: chips wrap, no horizontal overflow; dark mode contrast on chip + dot.
9. Regressions: Tracked grouping headers, R244 detail chips, R243/R242 filters.
