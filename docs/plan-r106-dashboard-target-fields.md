# R106 — Company + Experience level in dashboard resume dialogs

## First-hand evidence (2026-08-29, app.rezi.ai, logged-in)

- `~/audit-r1/shots-r106/create-step1.png/.txt`: Rezi's **Create a resume** wizard fields are
  RESUME NAME (required), **EXPERIENCE** (`Select...` level dropdown), import upload,
  LANGUAGE, and a **Target your resume** toggle — seniority and targeting are captured at
  creation time, before the editor ever opens.
- `~/audit-r1/shots-r105/settings-top.png/.txt` (R105 audit): Rezi's per-resume **Settings**
  edits JOB TITLE + **COMPANY NAME** + JOB DESCRIPTION.

## Gap

HonestCV added `experienceLevel` (R104) and `targetCompany` (R105) to the builder's Target
job section, but the two dashboard dialogs lag behind:

- **Start a new resume** asks only Target role + Job description — a new resume starts with
  no seniority/company even though both now ground every AI call.
- **Resume settings** (per-copy edit) edits name/folder/role/JD only — a copy targeting a
  specific company can't record it without opening that copy in the builder.

## Design

Pure UI wiring of existing model fields; no schema, worker, quota, ATS or export change.

1. `Start a new resume` dialog: add **Company** (`Input`, placeholder "e.g. Acme Corp") and
   **Experience level** (native `<select>`, Auto + `EXPERIENCE_LEVELS`, same 40px+ control
   style as builder). `startNewResume` spreads them into the created resume
   (`targetCompany: company.trim() || undefined`, `experienceLevel: level`). Role+Company on
   one `sm:grid-cols-2` row; both optional (dialog copy already says fields are optional).
2. `Resume settings` dialog: same two controls; Save writes
   `targetCompany: editing.targetCompany.trim() || undefined` and
   `experienceLevel` into `data` alongside the existing role/JD patch.
3. Mobile: inputs `h-10`+ (existing dialog inputs are `h-10` = 40px, keep that), select
   `h-10`; dialog already stacks at 375px.

## Non-goals

Resume name field in the create dialog (dashboard names copies on save), language selection,
Rezi's human "formatting review" upsell, import inside the dialog (dashboard already has an
import tile).

## Verification

lint/typecheck/build local green; production QA: create-with-level+company lands in
`honestcv.resume`, settings edit persists to the copy's `data` (deep-equal elsewhere),
builder shows the same values after opening, 375px no overflow, R104/R105 regression,
localStorage byte-for-byte restore.
