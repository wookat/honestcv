# R566 — Resignation letter saves title as "Untitled" while the letter body names the employer

## First-hand production evidence (CDP, 2026-09-06, bundle index-kVkULu1c.js)

R565 QA, offer job flow: resume seeded with an ongoing employer (Globex), resignation
dialog opened from /jobs, "Start from a template" → "Save to My resumes". Saved career doc
title: `Untitled — Resignation letter` — even though the generated letter body itself says
"my position as Software Engineer at Globex" (the template already falls back to the
ongoing experience entry). /documents and the new R565 jobs-pane row both display the
dishonest "Untitled" title.

## Root cause (src/pages/Builder.tsx)

- `insertTemplate` computes `currentJob` (first non-hidden ongoing experience entry) and
  uses `company || currentJob?.company` for the letter text.
- The Save button's `docTitle` for resignation uses only the typed `company` state:
  `${company || 'Untitled'} — Resignation letter`. The dialog's company input is optional
  on the template path, so the title ignores the employer the body already names.
- Cover titles fall back to `resume.targetRole`; interview titles fall back to
  `targetRole`/`fullName` (R398). Resignation is the only letter kind with no fallback.

## Rezi comparison

Rezi names generated documents after the role/company context they were created from
(August 2026 changelog: personalized generated documents); it never labels a letter
"Untitled" when the source facts are known.

## Fix (smallest valuable change)

`src/pages/Builder.tsx` only: hoist the ongoing-employer lookup out of `insertTemplate`
into the dialog body (`ongoingJob`), reuse it in both the template seeding and the save
`docTitle`, so the resignation title becomes
`${company || ongoingJob?.company || 'Untitled'} — Resignation letter`.

## Non-goals

No changes to letter content/generation, cover/interview titles, pipeline linking
(R563–R565), numbering (R556), or exports.

## Validation

`npx tsc -b`; `npx eslint src/pages/Builder.tsx`; `npm run build`; `npm run verify-dist`.

## Deployment

`npx wrangler deploy` — expect assets+worker upload success, Workers Routes publish
failure (auth code 10000, known token gap).

## Production QA (1280 + 375)

Seed resume with ongoing employer → offer job → Open resignation letter → template path →
save → doc title `Globex — Resignation letter`; jobs pane row and /documents card show the
employer-named title; typed company still wins; no ongoing employer + no typed company
still yields Untitled; zero overflow; restore six-key storage baseline; zero AI quota.
