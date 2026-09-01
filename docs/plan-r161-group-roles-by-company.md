# R161 — Group roles at the same company (promotion view)

## Rezi observation (firsthand, app.rezi.ai Finish Up, 2026-08-31)

- The Finish Up toolbar has a **Show promotion** toggle next to "View as pages".
- With two Experience entries at the same company (Software Engineer + Senior
  Software Engineer, both "Acme Corp"), toggling it ON regroups the preview:
  the company name is promoted to a single group heading rendered once, and
  each role appears nested under it with its own bullet list. The per-role
  company line disappears.
- OFF (default) renders each entry independently with its own company line —
  exactly RezUp's current behavior.

## Gap

RezUp always repeats the company on every experience entry. Career-changers
with promotions (a case our own guide `/guides/multiple-positions-same-company`
recommends stacking for) cannot get the standard stacked layout in preview or
any export.

## Plan

1. Schema (additive, optional, default off — same pattern as `sectionDivider`):
   `groupByCompany?: 'off' | 'on'` on `Resume`, normalized in `normalizeResume`.
2. Pure helper in `src/lib/resume.ts`:
   `experienceGroups(entries): { company, entries[] }[]` — groups *consecutive*
   entries whose trimmed, case-insensitive company names match (empty company
   never groups). Grouped rendering applies only to groups with ≥2 entries;
   singletons render exactly as today.
3. Renderers (only when `groupByCompany === 'on'`):
   - Preview (`ResumePreview.tsx`): company as a bold group line (inline-edit
     commits the rename to every entry in the group), roles beneath without the
     "· company" suffix; per-role dates/location/bullets and all R127/R129/R130
     inline editing unchanged.
   - PDF (`pdf.ts`), DOCX (`docx.ts`), TXT/MD (`resumeToPlainText` /
     `resumeToMarkdown`): same grouping, company line once then role lines.
4. Toggle UI: "Group roles by company" switch in the Builder design controls
   (persisted on the resume so share/export follow; lands in the R160
   "Design & layout" history diff group automatically).
5. Out of scope: reordering entries to force groups (grouping is consecutive
   only, respecting manual order and R145 date sort), education grouping,
   score/ATS changes.

## QA (production, 1600 + 375)

- Toggle ON with two consecutive same-company entries → single company heading,
  two role blocks; PDF/DOCX/TXT/MD match.
- Non-consecutive same company or differing companies → unchanged layout.
- Toggle persists across reload; hidden entries (R141) excluded before grouping.
- Inline edit of grouped company renames all roles in the group.
- 375px: no horizontal overflow; R160 history diff shows Design & layout.
