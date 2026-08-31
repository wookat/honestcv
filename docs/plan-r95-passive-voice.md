# R95 — Passive-voice bullet check (free; Rezi gates it behind Pro)

## First-hand evidence (2026-08-29, logged-in Rezi audit, ~/audit-r1/shots-r95/)

- Rezi's "Explore My Rezi Score" modal lists per-experience content analyses. Free tier
  shows **Weak bullet points**; **Personal pronouns / Buzzwords / Passive voice /
  Filler words** are all badged `PRO` ($29/mo) (`score-modal-text.txt` lines 111–118).
- HonestCV already ships pronouns (`first-person`), buzzwords (`buzzword`) and filler
  (`filler`) checks free since R63/R79. **Passive voice is our last missing content
  analysis** from that list.
- Also re-verified this round: the Finish Up toolbar is now fully covered
  (Auto-adjust→Auto-fit, template/share/download, icons R94, font family/size/line
  height/section spacing/indent/divider R84–R93, paper size, text/accent color,
  view-as-pages→paginated preview). The preview "Break" element is Rezi's dashed
  page-boundary marker, which our paginated preview already renders. The AI Keyword
  Targeting card ("Is this missing keyword relevant? YES→add bullet / NO") is covered
  by our richer per-keyword chips (+Skills / AI draft / not-relevant, R64+keyword-bullet).
  "How You Compare" percentile histogram stays rejected (no real cohort data = fake).
  Profile picture stays deferred (Pro gate + schema/export overhaul).

## Design

New `BulletIssue` kind `'passive'` in `src/lib/guidance.ts` `checkBullet()` — pure
rule-based, local, zero AI/schema/API changes.

Conservative pattern to keep false positives low:

- Auxiliary: `\b(was|were|is|are|been|being)\b`
- Followed by at most one adverb (`\w+ly`), then a past participle:
  - regular: `[a-z]{3,}ed`
  - irregular whitelist: built, made, given, done, taken, chosen, driven, written,
    held, kept, led, brought, taught, seen, shown, known, grown, won, run, built,
    sent, set, put, found, paid, sold, told
- Not flagged: progressive tense ("was working"), plain adjectives after aux
  ("was responsible" — caught by weak-opener anyway), bullets without an aux.

Message: `Passive voice ("was …") hides who did the work — rewrite with an active verb`.

Surfaces automatically through the existing R79/R80 plumbing: per-line amber warnings
under each experience bullet, per-entry issue counts, and the green
"best practices applied" line (now requires zero passive hits too). No new UI.

Out of scope: NLP/ML passive detection, summary/other-section coverage (bullets only,
matching Rezi's per-experience analysis), score/70-30 weighting changes, resumeHealth
dimension changes (verbs dimension already penalizes weak bullets).

## Verification

- Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
- Production QA: passive bullets ("was promoted to…", "Reports were written by me")
  flagged; active bullets ("Built…", "Led…") and progressive ("was working") not
  flagged; fix clears the warning and green line returns; 2-warnings-per-line cap
  behavior; 375px layout; console clean; zero AI calls; localStorage restored.
