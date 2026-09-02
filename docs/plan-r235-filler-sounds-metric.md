# R235 — Filler Words (sounds) as a distinct interview delivery metric

## First-party Rezi evidence

Rezi AI Interview docs (`/rezi-docs/ai-interview-practice-filler-words`, updated Aug 7 2026):

- "Filler Words is one of five key categories that Rezi AI Interview assesses you on. It
  measures how often you use involuntary filler sounds like 'um' and 'uh'."
- "Filler words refer to unintentional sounds, not conversational phrases. These include:
  'Um' 'Uh' 'Er' 'Ah' 'Hm'."
- "As a general guideline, strong interview communication typically includes no more than
  1–2 filler sounds per minute."

The Quick Fillers guide symmetrically says quick fillers are "habitual conversational
phrases", not sounds. So Rezi separates the two metrics, and Filler Words has an explicit
per-minute target.

## Gap in HonestCV

R234 folded the sounds `um/uhm/uh/er` into the quick-filler phrase list. Consequences:

1. Sounds and phrases are reported in one undifferentiated row, unlike Rezi's two metrics.
2. `ah` and `hm` are not detected at all.
3. There is no per-minute threshold judgment (≤2/min fine vs above), only a raw rate.

## Design (local, deterministic, zero AI)

`src/lib/interviewAnalysis.ts`:

- Remove `um/uhm/uh/er` from `QUICK_FILLER_PHRASES` (phrases only, per Rezi's definition).
- New pure function:

```ts
export interface FillerSoundAnalysis {
  hits: { sound: string; count: number }[]
  total: number
  perMinute: number | null           // only when elapsedSeconds >= 5
  band: 'good' | 'high' | null       // perMinute <= 2 → good, > 2 → high; null when untimed
}
export function analyzeFillerSounds(answer: string, elapsedSeconds?: number): FillerSoundAnalysis
```

- Sounds: `um, uhm, uh, er, ah, hm, hmm` — case-insensitive, word-boundary (`summer`,
  `Berlin`, `ahead`, `erred` must not match).
- `perMinute` rounding identical to R234 (`round(total/(elapsed/60)*10)/10`).

`src/pages/Builder.tsx` practice dialog:

- New row under the quick-fillers row, only when `total > 0`:
  - Untimed: `Filler sounds: “um” ×2, “uh” ×1.` (amber)
  - Timed good: `Filler sounds: … — 1.3/min, within the 1–2/min guideline.` (emerald text)
  - Timed high: `Filler sounds: … — 4.0/min — aim for no more than 1–2 per minute; pause instead.` (amber)
- Quick-fillers row unchanged except it no longer includes sounds.

## Invariants

- `analyzeAnswer` and the practice score untouched (scores bit-identical).
- Zero schema/localStorage changes, zero AI/network calls, session-scoped only.

## QA matrix

- Timed fixture with known sound counts at a deterministic elapsed → exact counts, rate,
  band boundary (2.0/min good, 2.1/min high).
- Sounds no longer in the quick-fillers row; phrases unaffected.
- Negative: summer/Berlin/ahead/erred/hmmm-as-word-boundary behavior verified.
- Untimed: counts only, no rate/band.
- Score invariance timed/untimed; R233 pace/speaking-time and R234 rows regression.
- 375px wrap, dark-mode contrast; localStorage baseline restored.
