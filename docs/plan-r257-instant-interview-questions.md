# R257 — Instant local interview questions from the resume + target job

## Rezi first-party evidence

- rezi.ai/tools — AI Interview: "Practice for your next interview with an AI interviewer
  that asks **role-specific questions based on your resume and target job**."
- rezi.ai/ai-interview — the interview is personalized to the candidate's own materials,
  not a generic question bank.

## Gap in HonestCV today

The interview-practice tool's only question source besides manual typing is the AI
"Suggest questions" button (`aiInterviewQuestions`, quota-gated, needs a pasted JD).
When the free AI quota is exhausted or the user wants zero-AI practice, there is no way
to get role-specific questions — even though the resume and target job already contain
everything needed to generate a solid deterministic set. Every other interview metric
(R201 analysis, R233–R236 delivery, R250/R256 keywords) is instant and local; question
sourcing is the one step still requiring AI.

## Design (pure derived data, zero AI / persistence / schema / score changes)

New pure helper in `src/lib/interviewAnalysis.ts`:

```ts
export function localInterviewQuestions(resume: Resume): string[]
```

Deterministic composition, capped at 6, in this order:

1. Opener — always present:
   - with targetRole: `Walk me through your background — why are you a fit for the
     <targetRole> role<at <targetCompany>>?`
   - without: `Walk me through your background — what kind of role are you looking
     for next?`
2. Up to 2 experience questions from the first two **visible** (`!hidden`) experience
   entries with a non-empty role:
   `Tell me about your time as <role>< at <company>>. What result are you most proud
   of from that role?`
3. Up to 2 keyword questions from the JD's high-priority keywords
   (`extractKeywords` + `highPriorityKeywords`, same universe as R202/R250), in
   extraction order:
   `This role emphasizes <keyword>. Describe a specific project where you used it and
   what the outcome was.`
4. Behavioral closer — always present:
   `Tell me about a time something went wrong at work. What did you do, and what
   changed afterwards?`

No JD → no keyword questions (opener + experience + closer still work: the tool stays
useful without a JD, unlike the AI path which requires one). Empty resume → opener +
closer only.

UI (`src/pages/Builder.tsx`, interview practice tool): new "Instant questions" button
next to the AI "Suggest questions" button (outline, ListChecks icon, no spinner —
synchronous). It feeds the existing `suggested` list, so the existing pick-one buttons
and "Practice all N" session flow are reused unchanged. A caption on the list is NOT
added — the button label plus instant render already communicate the source.

## Non-goals

- No changes to `aiInterviewQuestions`, `analyzeAnswer`, or practice score formulas.
- No new localStorage keys, no persistence, no worker changes, no AI calls.
- No schema changes; no payment changes.

## Validation

- Oracle byte-compare of the generated list for fixtures: full resume + JD (6
  questions, order fixed), no JD (4), hidden-only experience (no experience
  questions), empty resume (2), no targetCompany (opener drops "at …").
- Existing flows regress: AI Suggest questions, Practice all N, per-question pick,
  R201/R233–R236/R250/R256 analysis lines, session transcript save.
- 375px layout, light/dark contrast ≥ 4.5:1, zero `/api/ai/*` completions.
