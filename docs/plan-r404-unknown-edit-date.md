# R404 — honest "Edited …" label when a career document's timestamp is unknown

## Evidence

R402's read-side sanitizer (`sanitizeCareerDoc` in `src/lib/documents.ts`)
coerces a missing/invalid `updatedAt` to `0` so a corrupted entry can survive.
The dashboard then renders `editedAgo(0)`:

```ts
const editedAgo = (ms: number) => {
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days <= 0) return 'Edited today'
  return days === 1 ? 'Edited 1 day ago' : `Edited ${days} days ago`
}
```

→ "Edited 20701 days ago" (epoch age) on the career-document card — a
nonsense date presented as fact. Confirmed in the R403 SOP-10 audit (banked
P4). Resume copies always carry a real `updatedAt`, so only the careerDocs
call site can hit it, but the guard belongs in the helper.

## Fix

`editedAgo`: an unknown timestamp (`!ms` — 0, NaN) reads as
"Edited a while ago" instead of a fabricated epoch distance. No storage or
sorting change (`0` still sorts oldest, which is correct for unknown).
The value self-heals to a real timestamp on the next natural save (R402).

## Non-goals

- `/jobs?job=<bogus>` fallback-to-first — deliberate R312 design, stays.
- ~1MB ATS draft load freeze — profiled the full compute chain
  (`scoreResumeText` + `parseResumeText` + `resumeHealth` + `priorityFixes`)
  at 1MB in Node: < 260ms total; the freeze is renderer-side (1MB controlled
  textarea). Stays banked pending a real browser profile.

## Verify

Local: tsc / eslint / build. Production QA: seed a careerDoc with
`updatedAt: 0` → card shows "Edited a while ago"; open/rename it → real
timestamp restored → normal "Edited today"; docs with real timestamps
unchanged; 375px light/dark; zero console errors; baseline restored.
