# R202 — High-priority vs remaining missing-keyword tiers (Rezi keyword scanner parity)

## Evidence (public, first-party)

Rezi keyword scanner FAQ, https://www.rezi.ai/tools/resume-keyword-scanner (fetched 2026-09-01):

> "In a few seconds, you'll receive a detailed analysis that highlights which relevant keywords
> you already have and which important ones are missing. It will break down the suggestions
> (often as 'High Priority' keywords vs. other keywords) so you can easily add them…"

Rezi AI-interview page repeats the same report structure: "a breakdown with two different
sections – 'High Priority Words' and 'Remaining Keywords'".

## Gap

RezUp shows missing JD keywords as one flat chip list (Builder Target job panel, /ats-checker).
Every missing keyword looks equally important; Rezi's public keyword report triages them.

## Design (display-only, zero scoring change)

`src/lib/ats.ts` — new export:

```ts
highPriorityKeywords(jd: string, keywords: string[]): Set<string>
```

A keyword is high priority when any of:
- it is a matched KNOWN_PHRASE (multi-word skills are deliberate JD language);
- it occurs ≥3 times in the JD;
- it appears in the JD's requirements block — text following the first heading matching
  `/(requirements|qualifications|must[- ]haves?|what you.ll need|what we.re looking for|who you are)/i`;
- it appears in the JD's first line (usually the job title).

UI (both keyword surfaces):
- Builder Target job panel: "Missing (n)" splits into "High priority (h)" (red label, same
  interactive chips: + Skills / AI bullet / not-relevant) followed by "Remaining (r)"
  (muted label, same chips). When one group is empty only the other renders, preserving the
  existing single-list look.
- /ats-checker results card: same two-group split for the missing list (plain chips there).

Matched list, ignored list, keywordDetail, scores, exports: untouched.

## Acceptance

- JD with a "Requirements:" block: keywords from that block and ≥3× keywords appear under
  High priority; the rest under Remaining; totals equal the previous flat count.
- ATS/keyword scores identical before/after (display-only).
- Chip actions (add to skills, AI-bullet draft, not-relevant, restore) work in both groups.
- /ats-checker upload/paste path shows the same tiers.
- 1440 + 375px, dark mode; R201 practice card and R200 sidebar regression green.
- lint/tsc/build green; deploy; production QA by testing agent.
