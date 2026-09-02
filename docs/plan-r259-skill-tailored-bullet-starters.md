# R259 — skill-tailored bullet starters for the target job

## First-party Rezi evidence

rezi.ai/tools/resume-bullet-point-generator (public tool page, fetched 2026-09-02):

- "Enter your role details and select skills to generate tailored bullet points."
- "Instantly create impactful, professional bullet points tailored to your target role."
- "Each bullet point uses proven resume writing techniques: action verbs, quantifiable impact, and clear structure."
- Step 1 asks for the role; the tool panel has "Role Details … GENERATE BULLET POINTS" driven by JOB TITLE + selected skills.

rezi.ai/tools (AI Keyword Targeting): "Rezi identifies them, categorizes them by priority, and shows you where to add them."

## Gap in HonestCV

- `bulletStartersFor(role)` (R139 lineage, `src/lib/bulletStarters.ts`) returns fixed role-family templates. Skills play no part: the starters are identical whether the JD demands Kubernetes or Salesforce.
- Skill-specific bullets exist only through AI paths (`aiKeywordBullet` in the keyword triage, `aiSuggestBullet`), both quota-gated. There is no zero-AI path from "the JD wants skill X" to "a structured bullet using X" — the exact combination Rezi's free generator sells (role + selected skills → tailored bullets).

## Proposed behavior (pure local, zero AI)

New pure function in `src/lib/bulletStarters.ts`:

```ts
export function skillBulletStarters(role: string, skills: string[]): string[]
// one starter per skill, cycling 3 role-family skill templates (same families as
// bulletStartersFor; generic fallback), e.g. engineer + "kubernetes" →
// "Used kubernetes to build [feature/service], improving [metric] by [add %]"
```

- Templates keep the house style: strong action verb + the skill + `[add …]` placeholders, never invented numbers.
- Skill text is inserted verbatim (JD keywords are lowercase, consistent with existing keyword chips).

Builder wiring:

- `BulletIdeas` gains a `skills: string[]` prop. When non-empty, the open panel shows a new group ahead of the existing starters: "Tailored to your target job:" with one add-button per skill starter, then the existing role starters/action verbs unchanged.
- Skills for each experience entry = `ats.missing` ordered high-priority first (`highKw`), capped at 6. `ats.missing` already excludes `ignoredKeywords` and covered keywords, so the list shrinks live as keywords get added to the resume.
- No JD / no missing keywords → prop empty → panel renders exactly as pre-R259.

## Non-goals

No AI calls, no worker/schema/scoring changes, no persistence changes, no new dialogs; `bulletStartersFor`, keyword triage, and AI bullet paths untouched.

## Verification

- tsx oracle for `skillBulletStarters` (family cycling, generic fallback, verbatim skill insertion).
- Production QA: JD-loaded resume → per-entry "Need ideas?" shows tailored group with high-priority-first ordering and 6-cap; clicking inserts the starter as a bullet; adding a skill to the resume removes it live; ignored keywords excluded; no-JD panel byte-identical to pre-R259; R139 starters/action verbs regression; 375px; light/dark contrast; zero /api/ai calls.
