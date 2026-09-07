# R387 — ATS checker "open in builder" no longer wipes the saved job description

## Evidence (source, 2026-08-31)

- `/ats-checker` scores with the JD box optional (`Check my ATS score` only requires
  30+ chars of resume text; every JD-driven panel is gated on `jd.trim()`).
- `openInBuilder` (src/pages/AtsChecker.tsx) always writes the JD box into the resume:
  - keep-saved path (`Cancel` on the replace confirm): `existing.jobDescription = jd` —
    with an empty JD box this **wipes the saved resume's job description to ''**,
    destroying the target-job context (ATS keyword scoring, tailoring) the user had in
    the Builder, despite the confirm promising "Cancel keeps your saved resume".
  - replace path: `parsed.jobDescription = jd` — fine (fresh parse, nothing to lose).
- Reachable from every priority-fix "Fix in the builder →" link and the bottom CTA.

## Plan

`src/pages/AtsChecker.tsx` only — in `openInBuilder`, carry the JD over only when the
box has content:

```ts
} else if (existing) {
  if (jd.trim()) {
    existing.jobDescription = jd
    saveResume(existing)
  }
}
```

(The navigate stays unconditional; with an empty JD box the saved resume is left
completely untouched.)

## Non-goals

- No change to the replace path or the confirm wording.
- No sync of the carried-over JD into a bound copy here — Builder's own autosave
  already owns that (existing behavior).
