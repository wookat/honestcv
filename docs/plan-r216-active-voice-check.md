# R216 — "Active voice in bullet points" ATS structure check (Builder + /ats-checker)

## Rezi first-hand evidence

Rezi's "Using the Rezi Score" user guide (intercom.help/rezihelp, one of the 23
audits, Content category):

> "Passive voice - Using passive voice in your resume can make it harder for
> employers to identify your specific contributions and responsibilities.
> Always use an active voice for an engaging touch."

## Gap in HonestCV

`checkBullet` in `src/lib/guidance.ts` has flagged passive voice per bullet
since R168 (wavy underline, audit chips), but neither ATS scoring path has a
structure check for it — a resume whose every bullet is passive ("was
responsible for…", "were developed by the team") scores identically to an
active-voice one, and passive voice never reaches Priority fixes or the
"Fix in builder →" deep link. Rezi audits it as one of the 23.

## Design

New structure check `Active voice in bullet points` in `src/lib/ats.ts`, same
shape as R208–R215. Anchor `experience`.

- Move `PASSIVE_RE` / `IRREGULAR_PARTICIPLES` / `findPassive` from
  `guidance.ts` into `ats.ts` (exported) and re-import in `guidance.ts` —
  `guidance.ts` already imports from `ats.ts`, so the reverse import would be
  circular. Detection behavior is unchanged: `(was|were|is|are|been|being)`
  + optional `-ly` adverb + past participle (regular `-ed` or the irregular
  list), e.g. "was built", "were carefully reviewed".
- `activeVoiceCheck(lines: string[])`: first line whose text matches
  `findPassive` fails the check; hint quotes the passive phrase and the
  offending line (truncated) and tells the user to lead with an active verb.
- Builder (`scoreResume`): lines = visible experience bullets + visible
  project/involvement descriptions + custom-section bullets — the same feed
  as the R211 pronoun check's experience segment (summary intentionally
  excluded: bios legitimately use constructions like "recognized as…").
- Checker (`scoreResumeText`): lines = bullet-marked lines anywhere in the
  pasted/extracted text (`BULLET_LINE_RE`, marker stripped). No bullet
  markers at all (pasting often strips them) → guard pass, no false alarms.
- Denominators shift by design: checker 15 → 16 checks, Builder 16 → 17
  rows. Scoring formula unchanged; enters R176/R203 Priority fixes and the
  R204 "Fix in builder →" deep link automatically.
- No AI, API, schema, or persistence changes; only `src/lib/ats.ts` +
  `src/lib/guidance.ts` (import move).

## Acceptance

- Builder: bullet "Was responsible for the deployment pipeline" fails, hint
  quotes "Was responsible"; rewriting to "Owned the deployment pipeline"
  passes. Hidden entries ignored. Priority fix deep-links to Experience.
- Checker: pasted text with "- The system was built by me" fails; same text
  with "- Built the system" passes; text with zero bullet markers passes
  (guard). Non-bullet passive prose (summary paragraph) does not trigger.
- Per-bullet guidance (R168 underline) keeps flagging independently.
- Arithmetic: no-JD checker score = round(passed/16·100); each fix +100/16
  = 6.3. Builder breakdown 17 rows.
- 375px, dark mode, and R214/R215/R211 regressions unchanged.
