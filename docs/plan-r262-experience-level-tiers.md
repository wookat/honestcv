# R262 — Experience level tiers parity (Associate / Junior / Director)

## First-party evidence
Rezi guide "Experience Level" (rezi.ai/rezi-docs/how-to-set-resume-experience-level, published 2026-07-23):

> "You can choose from Internship, Entry-Level, Associate, Junior Level, Mid-Senior Level, Director, Executive."

with per-tier definitions (Associate ≈ 2–3 years, more independent; Junior ≈ some practical experience, ready for more responsibility; Director ≈ experienced leaders setting strategy and overseeing teams). The guide stresses the level "helps Rezi tailor the platform to you, which can influence the AI suggestions, personalized feedback, and even your Rezi Score".

## Current state (gap)
- `Resume.experienceLevel` supports only 5 tiers: `internship | entry | mid | senior | executive`.
- Inconsistency in our own copy: `pageLengthCheck` (src/lib/ats.ts) fails >1-page resumes with the hint "recruiters expect 1 (two only at director/executive level)" — but `director` is not selectable, so a director-level user cannot get the documented 2-page allowance.
- `aiTargetRole` annotates AI prompt context with the level label; missing tiers force users into a wrong bucket.

## Design (zero AI, additive enum)
1. `src/lib/resume.ts`
   - Extend the enum: `'' | 'internship' | 'entry' | 'associate' | 'junior' | 'mid' | 'senior' | 'director' | 'executive'`.
   - `EXPERIENCE_LEVELS = ['internship','entry','associate','junior','mid','senior','director','executive']` (career order; both selects render from this).
   - Labels: `associate: 'Associate'`, `junior: 'Junior level'`, `director: 'Director'`.
   - `sanitizeResume` asEnum whitelist gains the three values (older payloads unaffected).
2. `src/lib/ats.ts` — `pageLengthCheck`: `allowed = level === 'executive' || level === 'director' ? 2 : 1`; pass-hint suffix says "at director/executive level" when allowed === 2. No score/other check changes.
3. UI: Builder Target-job select and Dashboard create/edit selects already map over `EXPERIENCE_LEVELS` — no edits needed beyond the shared arrays.

## Non-goals
No AI calls, no worker endpoints, no scoring formula changes, no new localStorage keys, no persisted-schema shape change (same optional string field, wider whitelist).

## Verification
- tsx oracle: EXPERIENCE_LEVELS order/labels; `aiTargetRole` for associate/junior/director (with/without role/company); sanitize round-trip keeps 'director', drops unknown values; legacy 5 values unchanged.
- Local: lint, build.
- Production QA: 8 options in Builder + Dashboard selects; director-level 2-page resume passes page-count check with "at director/executive level" hint while mid-level fails with the existing message; persistence round-trip; 375px; light/dark contrast; zero /api/ai/* completions.
