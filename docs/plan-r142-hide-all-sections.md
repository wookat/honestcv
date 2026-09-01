# R142 — Hide from resume for all remaining sections

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's per-entry `…` menu with **Hide from resume / Delete** is not limited to the
experience family: re-checked on `/certification` — the same menu with the same
toggle appears on every entry in every section sidebar. Hiding is a uniform
capability across the whole resume.

R141 shipped the toggle for Experience / Education / Projects only ("extend later
if the pattern earns it"). It did: the remaining eight structured sections
(Certifications, Involvement, Coursework, Awards, Publications, References,
Military, Agents) still only offer Delete.

## Change

- The eight remaining entry types (`CertificationItem`, `InvolvementItem`,
  `CourseworkItem`, `AwardItem`, `PublicationItem`, `ReferenceItem`,
  `MilitaryServiceItem`, `AgentItem`) grow the same `hidden?: boolean`
  (sanitizer keeps it only when `true`, same as R141).
- `visibleResume(r)` extends its filter to those arrays (all optional — filter
  behind `?? []` semantics, preserving `undefined` vs `[]`).
- Builder cards in those eight sections get the same Eye/EyeOff ghost toggle,
  `opacity-60` dim, and "Hidden" badge as R141. Forms keep editing hidden
  entries; only outputs filter (preview, exports, page count, ATS, AI contexts,
  share — all already consume `shown`, so they inherit the filtering for free).
- Custom sections are line-based (no entry cards) — out of scope, same as R141.

## Not in scope

- No new localStorage keys, no dependencies, no share/dashboard code changes
  (they already consume `visibleResume`).

## Verification

- lint + build green locally.
- Production, 1440px: hide a certification and a publication → gone from
  preview/TXT/ATS text instantly, badge + dim on card, toggle back restores,
  reload persists, undo/redo normal.
- 375px: toggles reachable, no overflow.
- Regression: R141 experience/education/project toggles, R122 publication kind,
  section library save/restore intact.
