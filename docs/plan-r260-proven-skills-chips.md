# R260 — proven-skill chips: skills your resume body demonstrates but never lists

## First-party Rezi evidence

rezi.ai/rezi-docs/ai-skills-explorer (fetched 2026-09-02):

- "AI Skills Explorer helps you identify relevant skills to add to your resume. It suggests skills based on what you've done, so you don't miss important or transferable skills."
- Use it if you "Want to uncover transferable skills" / "Are changing roles or industries".

rezi.ai/rezi-docs/skills (Skills section guide, fetched 2026-09-02):

- "Focus on the ones you can genuinely prove through your work experience, projects, education, training, or certifications."
- "it's completely normal for your skills section to overlap with your work history. Your skills section introduces your capabilities, while your experience section proves them with real examples and achievements."

## Gap in HonestCV

- The Skills section's suggestion chips (`skillSuggestionsFor`, R164 lineage) are fixed per role family — they never look at what the user actually did. An engineer whose bullets say "Automated reporting in Tableau" gets no Tableau chip because Tableau lives in the data-family list.
- The only "skills based on what you've done" path is the AI skill chips (`aiSkillChips`), which are quota-gated. There is no zero-AI path from "my bullets demonstrate X" to "X belongs in the Skills list" — the exact overlap Rezi's Skills guide calls normal and desirable.

## Proposed behavior (pure local, zero AI)

New pure functions in `src/lib/bulletStarters.ts`:

```ts
export function skillLexicon(): string[]
// union of every role family's curated skills (SKILL_GROUPS), deduped
// case-insensitively in group order — the transferable-skill universe

export function provenSkills(bodyText: string, skillsText: string): string[]
// lexicon skills that match bodyText but not skillsText. Matching mirrors
// keywordScore/keywordHighlight semantics: single words use non-alphanumeric
// word boundaries (no "java" hit inside "javascript"), phrases substring,
// both case-insensitive.
```

Builder wiring (Skills section):

- `proven = provenSkills(resumeToPlainText(shown), shown.skills)` in a memo — `resumeToPlainText` already respects hidden entries, and any skill already listed is excluded by the skillsText check, so including the skills lines in the body is harmless.
- When non-empty, a new chips row renders above the existing role-family chips: "Mentioned in your experience but not listed in Skills — recruiters scan this section first:" with one emerald-tinted `+ skill` chip each (cap 10), appended via the same comma-append handler as the existing chips.
- Existing role-family / AI chips row unchanged; no matches → row absent, panel identical to pre-R260.

## Non-goals

No AI calls, no worker/schema/scoring/persistence changes; `skillSuggestionsFor`, `aiSkillChips`, and ATS keyword logic untouched.

## Verification

- tsx oracle for `provenSkills`: word-boundary (java vs JavaScript), phrase matching, exclusion of already-listed skills (comma- and category-line formats), lexicon dedup across families.
- Production QA: engineer resume whose bullets mention cross-family skills (e.g. Tableau, Salesforce) → chips appear with canonical casing; click appends to Skills and the chip disappears live; skills listed under a category line are excluded; no-match resume shows no row; role chips row (R164) unchanged; 375px; light/dark contrast; zero /api/ai calls.
