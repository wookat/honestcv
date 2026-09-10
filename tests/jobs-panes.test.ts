import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const jobsSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Jobs.tsx'),
  'utf8',
)
const navSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/components/WorkspaceNav.tsx'),
  'utf8',
)

/** Every `<breakpoint>:` prefix used on the list / detail pane toggles. */
const paneBreakpoints = (): string[] => {
  const out: string[] = []
  for (const m of jobsSrc.matchAll(/mobileDetail \? '(?:hidden ([a-z]+):block|' : 'hidden ([a-z]+):block)/g)) {
    out.push(m[1] ?? m[2])
  }
  return out
}

describe('R818: /jobs keeps a single pane while the workspace sidebar shares the row (768–1023)', () => {
  it('the workspace sidebar appears at md, so a two-pane job board must wait for lg', () => {
    expect(navSrc).toMatch(/<aside className="hidden w-56 shrink-0 md:block"/)
    expect(jobsSrc).toMatch(/grid gap-4 lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,3fr\)\]/)
    expect(jobsSrc).not.toMatch(/md:grid-cols-\[minmax\(0,2fr\)_minmax\(0,3fr\)\]/)
  })

  it('list / detail visibility and "Back to list" switch at the same breakpoint as the grid', () => {
    expect(paneBreakpoints()).toEqual(['lg', 'lg'])
    const back = jobsSrc.slice(0, jobsSrc.indexOf('Back to list'))
    const backTag = back.slice(back.lastIndexOf('<button'))
    expect(backTag).toMatch(/\blg:hidden\b/)
    expect(backTag).not.toMatch(/\bmd:hidden\b/)
  })

  it('the single-pane history / scroll behaviour keys off the same media query', () => {
    expect(jobsSrc).toMatch(/const SINGLE_PANE_MQ = '\(max-width: 1023px\)'/)
    // history sentinel, open/close reveal + restore, and the R855 deep-link re-reveal
    expect(jobsSrc.match(/window\.matchMedia\(SINGLE_PANE_MQ\)/g)).toHaveLength(3)
    expect(jobsSrc).not.toMatch(/max-width: 767px/)
  })

  it('the title search box never shrinks below its placeholder (sm:min-w-72 ≥ 282 px text)', () => {
    const at = jobsSrc.indexOf('aria-label="Search jobs by title"')
    expect(at).toBeGreaterThan(-1)
    const tag = jobsSrc.slice(jobsSrc.lastIndexOf('<Input', at), jobsSrc.indexOf('/>', at))
    expect(tag).toMatch(/className="h-10 w-full max-w-md sm:w-auto sm:min-w-72 sm:flex-1"/)
  })
})

describe('R819: job-card titles wrap to two lines instead of one truncated line', () => {
  // Production, 150 rows: one-line `truncate` clipped 94 titles at 1024 px (191 px box,
  // ~15 chars hidden each), 57–62 at 375 / 1280; two lines clip 3–15 and leave no two
  // rows reading the same. The company · location line below it is handled by R849.
  const cardTitle = () => {
    const sub = jobsSrc.indexOf('{j.company} · {j.location}')
    expect(sub).toBeGreaterThan(-1)
    const at = jobsSrc.lastIndexOf('{j.title}', sub)
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(jobsSrc.lastIndexOf('<p', at), at)
  }

  it('the title paragraph clamps to two lines and breaks long words', () => {
    const tag = cardTitle()
    expect(tag).toMatch(/\bline-clamp-2\b/)
    expect(tag).toMatch(/\bbreak-words\b/)
    expect(tag).not.toMatch(/\btruncate\b/)
  })

  it('the company · location line below it stays the secondary text-xs line', () => {
    const at = jobsSrc.indexOf('{j.company} · {j.location}')
    expect(at).toBeGreaterThan(-1)
    const tag = jobsSrc.slice(jobsSrc.lastIndexOf('<p', at), at)
    expect(tag).toMatch(/\btext-muted-foreground\b/)
    expect(tag).toMatch(/\btext-xs\b/)
  })
})

describe('R849: job-card company · location wraps instead of losing the location', () => {
  // Production, 150 rows: the one-line `truncate` cut the company · location line on 19 / 60 / 23
  // rows at 1280 / 1024 / 375 and hid the location completely on 2 / 8 / 2 of them
  // ("J. J. Keller & Associates, Inc. · USA" read as the company alone). Simulated in the live DOM:
  // two lines still lost the location on 3 rows at 1024; three lines lost it on none
  // (13 rows grow by 32 px at 1024, 1–2 at 1280 / 375 — the rest by 16 px or not at all).
  const metaLine = () => {
    const at = jobsSrc.indexOf('{j.company} · {j.location}')
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(jobsSrc.lastIndexOf('<p', at), at)
  }

  it('clamps to three lines and breaks long words instead of truncating', () => {
    const tag = metaLine()
    expect(tag).toMatch(/\bline-clamp-3\b/)
    expect(tag).toMatch(/\bbreak-words\b/)
    expect(tag).not.toMatch(/\btruncate\b/)
  })

  it('the wrapping column can still shrink (min-w-0 flex-1) so wrapping never widens the row', () => {
    const at = jobsSrc.indexOf('{j.company} · {j.location}')
    const col = jobsSrc.slice(jobsSrc.lastIndexOf('<span className="min-w-0 flex-1">', at), at)
    expect(col).toContain('<span className="min-w-0 flex-1">')
    expect(col).not.toContain('</span>')
  })
})

describe('R850: opening the single-pane job detail brings the pane itself into view', () => {
  // Production 375×812 / 375×500 / 768×800: R532's `window.scrollTo(0, 0)` left the detail pane
  // 721 / 721 / 529 px down the page (91 / 0 / 271 px of it visible) because the search form above
  // the panes has grown since R532; the tapped job appeared to vanish. Scrolling the pane's own top
  // into view (html scroll-padding keeps it under the sticky header) puts it at 63 px at every size.
  const openEffect = () => {
    const at = jobsSrc.indexOf('listScrollRef.current = window.scrollY')
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(at, jobsSrc.indexOf('} else if (mobileDetailWasOpen.current)', at))
  }

  it('scrolls the detail pane to the top of the viewport instead of the page to 0', () => {
    const open = openEffect()
    expect(open).toMatch(/detailPaneRef\.current\.scrollIntoView\(\{ block: 'start' \}\)/)
    expect(open).not.toMatch(/^\s*window\.scrollTo\(0, 0\)/m)
  })

  it('the ref is on the detail pane container that hides below lg', () => {
    const at = jobsSrc.indexOf('ref={detailPaneRef}')
    expect(at).toBeGreaterThan(-1)
    const tag = jobsSrc.slice(at, jobsSrc.indexOf('>', at))
    expect(tag).toMatch(/mobileDetail \? '' : 'hidden lg:block'/)
  })

  it('still restores the list scroll offset when the pane closes (R532)', () => {
    const at = jobsSrc.indexOf('} else if (mobileDetailWasOpen.current)')
    expect(jobsSrc.slice(at, at + 200)).toContain('window.scrollTo(0, listScrollRef.current)')
  })
})

describe('R851: /jobs skill chips keep a 32 px (< sm) / 24 px (sm+) hit area', () => {
  // Production 375 / 768 / 1280: every skill chip in the detail pane's Skills row (and the list
  // header's "Repeated skills" row) was its 20 px text pill with 6 px gaps — the only controls in
  // the pane under 24 px (every other pane control is 40 / 32) and the target-size violation axe
  // reported on the R850 open-detail scan. The `+N more` link that extends the row is a target too.
  const chipClassStrings = () => {
    const out: string[] = []
    const re = /'[^']*rounded-full px-2 py-0\.5 text-xs[^']*'/g
    for (const m of jobsSrc.matchAll(re)) out.push(m[0])
    return out
  }

  it('both states of both skill chip sets declare min-h-8 sm:min-h-6', () => {
    const chips = chipClassStrings()
    expect(chips).toHaveLength(4)
    for (const c of chips) {
      expect(c).toContain('min-h-8')
      expect(c).toContain('sm:min-h-6')
    }
  })

  it('the "+N more" skills expander shares the hit area', () => {
    const at = jobsSrc.indexOf('setTagsExpandedId(selected.id)}')
    expect(at).toBeGreaterThan(-1)
    const tag = jobsSrc.slice(at, jobsSrc.indexOf('>', at))
    expect(tag).toMatch(/min-h-8 .*sm:min-h-6/)
  })
})

describe('R853: closing the single-pane job detail hands keyboard focus back to the job row', () => {
  // Production 375×812 / 768×800 (R852 bundle): after "Back to list" (pointer, Enter, Space) or the
  // browser's Back, `document.activeElement` was `<body>` — the Back button had unmounted with the
  // pane — and the next Tab landed on the workspace sidebar's "Upgrade" / "Resume builder" link past
  // the whole list, scrolling the page 567 → 964 / 377 → 678 and undoing R850's list restore. The row
  // the pane was showing (`job-card-<id>`) is visible again in the same commit, so it takes focus.
  const closeEffect = () => {
    const at = jobsSrc.indexOf('} else if (mobileDetailWasOpen.current)')
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(at, jobsSrc.indexOf('}, [mobileDetail])', at))
  }

  it('focuses the selected row without scrolling (the scroll offset is restored separately)', () => {
    const close = closeEffect()
    expect(close).toContain('window.scrollTo(0, listScrollRef.current)')
    expect(close).toMatch(/document\.getElementById\(`job-card-\$\{selectedIdRef\.current\}`\)/)
    expect(close).toMatch(/row\.focus\(\{ preventScroll: true \}\)/)
  })

  it('rescues focus that fell to <body> or still sits on the hidden pane; a dialog / toast keeps it', () => {
    // Deployed first cut (index-tBfk79We / Jobs-zznOBqGe) only checked `=== document.body`: browser
    // Back was fixed, but pointer / Enter / Space on the pane's Back button still lost focus — the
    // button is still `activeElement` during the commit that hides it (focus fixup runs later).
    const close = closeEffect()
    expect(close).toContain('active === document.body')
    expect(close).toContain('detailPaneRef.current?.contains(active) === true')
    expect(close).toMatch(/if \(lost && row instanceof HTMLElement\) row\.focus/)
  })

  it('reads the selection through a ref so the effect still keys off mobileDetail alone', () => {
    const at = jobsSrc.indexOf('const selectedIdRef = useRef(selectedId)')
    expect(at).toBeGreaterThan(-1)
    // synced in its own effect, declared before the close effect so it runs first in the same commit
    expect(jobsSrc.slice(at, at + 120)).toMatch(/useEffect\(\(\) => \{\s*selectedIdRef\.current = selectedId\s*\}, \[selectedId\]\)/)
    expect(at).toBeLessThan(jobsSrc.indexOf('} else if (mobileDetailWasOpen.current)'))
    expect(closeEffect()).not.toContain('selectedId)')
  })
})

describe('R854: Undo after stopping tracking hands keyboard focus to the restored job', () => {
  // Production 375×812 / 768×800 / 1280×800 (R853 bundle): on the Tracked tab with a search that
  // hides the job everywhere else, stopping tracking removes the only source of the open row —
  // the pane empties / single-pane returns to the list (R650) and the Undo toast takes focus (R646).
  // Undo restored the row, but `selected` was already `null` (the job was in no list), so the
  // `find(... === selected?.id)` matched nothing, no target was queued, the toast unmounted and
  // focus fell to `<body>`: the next Tab went to "Skip to content" at the top of the document.
  // Dismiss (neighbour row) was unaffected.
  const undoHandler = () => {
    const at = jobsSrc.indexOf('restorePipelineEntries(undoUntrack)')
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(at, jobsSrc.indexOf('setUndoUntrack(null)', at))
  }

  it('matches the restored entry by selectedId, which outlives a row that vanished from every list', () => {
    const undo = undoHandler()
    expect(undo).toContain('const restoredId = selectedId ?? selected?.id')
    expect(undo).toMatch(/undoUntrack\.find\(\(r\) => r\.entry\.job\.id === restoredId\)/)
  })

  it('prefers the pane\u2019s status chip, then the list row (the chip is display:none on a single pane)', () => {
    // useFocusAfterRender takes the first id that actually receives focus; a `hidden lg:block` pane
    // rejects focus below lg, so the row wins there and the chip wins on the desktop split pane.
    const undo = undoHandler()
    expect(undo).toMatch(/focusAfterRender\(\s*`track-chip-\$\{restored\.entry\.status\}`,\s*`job-card-\$\{restored\.entry\.job\.id\}`,?\s*\)/)
    expect(jobsSrc).toMatch(/mobileDetail \? '' : 'hidden lg:block'/)
  })
})

describe('R855: Undo after a bulk "Untrack N" hands keyboard focus to a restored row', () => {
  // Production 375×812 / 768×800 / 1280×800 (R854 bundle): Tracked tab → Select… → two checkboxes →
  // Untrack 2 → Stop tracking. The toast took focus (R646) and Dismiss went to the neighbour row
  // (R650), but Undo brought the rows back with focus on `<body>` — the next Tab went to
  // "Skip to content". No job was open, so the R854 `find(... === restoredId)` matched nothing and
  // nothing was queued. The fallback is the first restored entry's row (pipeline order), then main.
  const undoHandler = () => {
    const at = jobsSrc.indexOf('restorePipelineEntries(undoUntrack)')
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(at, jobsSrc.indexOf('setUndoUntrack(null)', at))
  }

  it('falls back to the first restored row, then main, when no restored entry is the selected job', () => {
    const undo = undoHandler()
    expect(undo).toMatch(/else focusAfterRender\(`job-card-\$\{undoUntrack\[0\]\.entry\.job\.id\}`, 'main'\)/)
  })

  it('does not aim the fallback at another job\u2019s status chip (the open pane may show a job that was not untracked)', () => {
    const undo = undoHandler()
    const fallback = undo.slice(undo.indexOf('else focusAfterRender'))
    expect(fallback).not.toContain('track-chip-')
  })
})

describe('R855: a ?job= deep link on a single pane reveals the pane once the first fetch has laid out the page', () => {
  // Production 768×800 (R854 bundle): the R850 reveal runs on mount, while the pane still sits at
  // document Y 235; the first fetch then renders the status / location filter rows above it and the
  // pane ends at Y 529 with the page still at scrollY 172 — pane top 357 instead of the 63 a tap gives
  // (375×812 happened to settle at 63 both ways). Re-revealing once `loading` clears puts the cold
  // link where the tap path lands; the flag is armed only by the deep link, so later fetches (a new
  // search typed above an open pane) never scroll the page.
  const revealEffect = () => {
    const at = jobsSrc.indexOf('if (loading || !revealAfterFetch.current) return')
    expect(at).toBeGreaterThan(-1)
    return jobsSrc.slice(at, jobsSrc.indexOf('}, [loading])', at))
  }

  it('is armed by the ?job= deep link only, and disarmed after one use', () => {
    expect(jobsSrc).toMatch(/const revealAfterFetch = useRef\(seedParams\.get\('job'\) !== null\)/)
    expect(revealEffect()).toContain('revealAfterFetch.current = false')
  })

  it('reveals the pane the same way a tap does, only on a single pane', () => {
    const effect = revealEffect()
    expect(effect).toContain('if (!window.matchMedia(SINGLE_PANE_MQ).matches) return')
    expect(effect).toMatch(/detailPaneRef\.current\?\.scrollIntoView\(\{ block: 'start' \}\)/)
  })
})

describe('R857: Tracked-tab bulk checkboxes get a hit box the size of the other row controls', () => {
  // Production 375×812 / 1280×800 (R856 bundle): every control in the Select… row is 40 px (< sm) /
  // 32 px, but each row's checkbox was its bare 16 × 16 box with no <label>; trusted taps 14 px off
  // its centre hit the row's padding and did nothing, and the job-card button starts 10 px to its
  // right. The wrapping label pads the box out to the row's own padding (36 × 44 measured in a DOM
  // simulation) with negative margins, so the row height does not move, and stops short of the card
  // button (R852: a hit box never covers a neighbouring control). Touch is a second oracle: Chrome's
  // touch adjustment hands a tap to a clickable neighbour up to ~8 px away even when the tap lands
  // inside the label, so with a 2 px clearance the label's right 4 px opened the job card (production
  // CDP touch sweep, identical before and after the label). A 16 px row gap keeps the card 8 px clear
  // of the label's right edge; the sweep then toggles at every label x.
  const checkbox = () => {
    const at = jobsSrc.indexOf("aria-label={`Select ${j.title} at ${j.company}`}")
    expect(at).toBeGreaterThan(-1)
    const start = jobsSrc.lastIndexOf('<label', at)
    return jobsSrc.slice(start, jobsSrc.indexOf('</label>', at))
  }

  it('wraps the checkbox in a label whose padding is cancelled by negative margins on three sides', () => {
    const tag = checkbox()
    const classes = /<label className="([^"]*)"/.exec(tag)?.[1].split(/\s+/) ?? []
    for (const c of ['-my-3', '-ml-3', '-mr-2', 'py-3', 'pr-2', 'pl-3', 'flex', 'shrink-0']) expect(classes).toContain(c)
    expect(tag).toContain('type="checkbox"')
  })

  it('keeps the visible box, its accent and its accessible name unchanged', () => {
    const tag = checkbox()
    expect(tag).toMatch(/className="accent-primary mt-1 size-4 shrink-0"/)
    expect(tag).toContain('aria-label={`Select ${j.title} at ${j.company}`}')
  })

  it('keeps the job-card button 8 px clear of the padded box (16 px row gap, 8 px of it inside the label)', () => {
    expect(jobsSrc).toMatch(/tab === 'tracked' && bulkMode \? 'flex items-start gap-4' : ''/)
  })
})

describe('R859: the bulk action controls are reserved for the whole Select… session, so the first tick does not move the rows', () => {
  const bar = () => {
    const at = jobsSrc.indexOf('aria-label="Bulk actions on tracked jobs"')
    expect(at).toBeGreaterThan(-1)
    const end = jobsSrc.indexOf('\n        )}\n', at)
    return jobsSrc.slice(at, end)
  }

  it('mounts "N selected", Move to…, Untrack and Clear as soon as bulk mode is on, not once something is ticked', () => {
    const src = bar()
    expect(src).toMatch(/\{bulkMode && \(\s*<>\s*<span/)
    expect(src).not.toMatch(/bulkMode && visibleBulkIds\.size > 0/)
  })

  it('disables the three actions while nothing is selected instead of hiding them', () => {
    const src = bar()
    expect(src.match(/disabled=\{visibleBulkIds\.size === 0\}/g)?.length).toBe(3)
    expect(src).toContain('{bulkUntrackLabel(visibleBulkIds.size)}')
  })

  it('does not change the checkbox row geometry R857 fixed', () => {
    expect(jobsSrc).toMatch(/tab === 'tracked' && bulkMode \? 'flex items-start gap-4' : ''/)
  })
})
