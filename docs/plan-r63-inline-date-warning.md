# R63 — Inline "Dates are missing" warning on experience entries

## Evidence (first-hand, logged-in Rezi audit, shots-r62/)

- `rezi-editor-experience.png`: Rezi's Experience editor shows a per-entry sidebar
  where "Dates are missing" is a first-class issue for the specific role being edited,
  alongside "Number of Bullet Points" and "Quantified Bullet Points".
- RezUp after R62: the global ATS check `Employment dates listed` fails when any
  populated role lacks a start date, but the hint ("add a start date to every role")
  does not tell the user *which* role is the problem. The Experience editor renders
  per-bullet quality warnings (`BulletGuidance`) but nothing about dates.

## Gap

A user with several roles and one missing date sees a failing global check with no
pointer to the offending entry. Rezi surfaces the issue exactly where it must be
fixed — inside the entry being edited.

## R63 scope (small, no new deps/APIs/storage)

1. In the Builder Experience section, under each entry's date inputs, render an
   inline amber warning when the entry is populated (role or company non-blank)
   and `startDate` is blank:
   "⚠ Dates are missing — add a start date so ATS parsers can place this role on your timeline."
2. Same populated-entry predicate as the R62 `Employment dates listed` check, so the
   inline warning and the global check always agree.
3. Styling matches the existing `BulletGuidance` warnings (text-xs, amber-700).

## Out of scope

- A full per-entry Rezi-style sidebar (bullet count / quantified per entry — the
  global checks plus BulletGuidance already cover those).
- Date format validation or end-date requirements (Present is valid).

## Acceptance

- Populated role without start date shows the inline warning; typing a start date
  removes it live; blank template entries show no warning.
- Global check and inline warning flip together.
- Local lint/tsc/build green; production QA at 1440px and 375px, no overflow,
  no console/page errors, localStorage restored byte-for-byte.
