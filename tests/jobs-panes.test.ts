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
    expect(jobsSrc.match(/window\.matchMedia\(SINGLE_PANE_MQ\)/g)).toHaveLength(2)
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
