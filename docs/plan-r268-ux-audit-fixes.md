# R268: fix the three escapes from the exploratory production audit (F1/F2/F3)

## Evidence (first-hand, production)

The R268 exploratory QA audit (docs/qa-r268-plan.md) ran the full golden path on
https://cv.zalize.com and found no P0/P1, and exactly three issues:

- **F1 (P2)** — React minified error #418 (hydration mismatch) on every landing
  page load *during the audit runs*. Root-cause investigation with CDP console
  capture reproduced it deterministically: the error fires **iff
  `localStorage['honestcv.theme']` is set** (`light` or `dark`) and never when
  the key is absent (`system`), 3/3 vs 3/3 runs. The audit ran with a dark-theme
  pass, hence "every load".
  - Cause: the landing route ships prerendered HTML (`scripts/prerender.mjs`).
    `ThemeToggle` in `src/components/Layout.tsx` initializes
    `useState(() => loadThemePref())`. At prerender time `localStorage` throws →
    `'system'` → Monitor icon + "System theme — switch to light theme" label.
    On a client with a saved pref the first render produces a Sun/Moon icon and
    a different `aria-label`/`title` → hydration mismatch → error #418 and a
    full client re-render of the tree.
  - Same latent hazard: `SiteHeader`'s `useState(() => attentionCount())` reads
    the tracked-jobs pipeline from localStorage at first render; any visitor
    with a stale tracked application would hit the same mismatch on the badge.
- **F2 (P3)** — an experience entry with a start date and a blank end date
  renders just `Jun 2023` (no `– Present`) in the live preview, PDF, DOCX, TXT
  and Markdown outputs, while the editor's own end-date field placeholder says
  "End (Present)" and the date picker offers an explicit Present option — the
  resume reads as if the role ended.
- **F3 (P3)** — with a job selected on the All tab, switching to an empty
  Tracked tab shows "Nothing tracked yet — use the status buttons on a job to
  track it." in the list column while the detail pane still shows the selected
  (untracked) job: two panes contradict each other.

## Fix design

All three are client-only, deterministic fixes. Zero worker/API/schema/AI/
persistence changes.

### F1 — hydration-safe browser-state reads in `Layout.tsx`

Standard SSR pattern: first client render must match the server. Initialize to
the server-renderable value and sync the real browser value in an effect:

```tsx
function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>('system')
  useEffect(() => { setPref(loadThemePref()) }, [])
  ...
}

export function SiteHeader(...) {
  const [attention, setAttention] = useState(0)
  useEffect(() => { setAttention(attentionCount()) }, [])
  ...
}
```

Cost: on SPA routes the toggle icon/badge appears one frame later — invisible
in practice. `applyThemePref` still runs before hydration in `main.tsx`, so the
actual page colors never flash.

### F2 — `experienceDateRange` helper applied to experience outputs

New pure function in `src/lib/resume.ts`:

```ts
export function experienceDateRange(startDate: string, endDate: string): string {
  const start = startDate.trim()
  const end = endDate.trim()
  if (start && !end) return `${start} – Present`
  return [start, end].filter(Boolean).join(' – ')
}
```

Applied at the five experience-entry date sites: `ResumePreview.tsx` (standard
+ sidebar layouts), `pdf.ts`, `docx.ts`, and the TXT + Markdown serializers in
`resume.ts`. Education/projects/involvement date semantics untouched (a blank
education end date does not imply "ongoing" the way a job does; scope stays on
the audited finding). Both-blank and both-set entries are byte-identical to
before; blank-start-with-end stays `end` only.

### F3 — clear a foreign selection when switching tabs in `Jobs.tsx`

In the tab button handler: when switching to a non-All tab, clear `selectedId`
unless the selected job is actually in that tab (tracked with any status for
Tracked; tracked with that status for status tabs). The empty state and the
detail pane can then never contradict each other; switching back to All keeps
the usual auto-select-first behavior.

## Verification matrix

- Oracle (`.tmp-smoke/r268_oracle.ts`): `experienceDateRange` forms — start
  only → `– Present`, both → unchanged join, end only, both blank; TXT/MD
  serializer lines for a start-only experience entry contain `– Present` while
  education lines are unchanged.
- Local: `npx tsc -b`, `npm run lint`, `npm run build` green.
- Production QA (testing agent): landing loads with `honestcv.theme` = light /
  dark / absent → zero console errors, 3× each; preview + real PDF/DOCX/TXT
  downloads show `Jun 2023 – Present` for a blank end date; explicit `Present`
  pick unchanged; All-tab selection + switch to empty Tracked shows the empty
  state with no detail pane; tracked selection survives the switch; 375px +
  dark mode passes; localStorage restored to baseline.

## Verified facts vs assumptions

- Verified: the theme-key ↔ error correlation (3/3 both ways, production CDP);
  prod HTML byte-identical to local build; the audit findings themselves.
- Inference (from code reading): the exact mismatching nodes are the toggle
  icon + aria-label. The fix removes every first-render localStorage read in
  the prerendered tree, so it holds even if the badge (not the icon) is the
  trigger on some loads.
