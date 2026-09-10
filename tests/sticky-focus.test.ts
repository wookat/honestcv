import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { stickyFocusRestore } from '../src/lib/stickyFocus'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
const builderSrc = read('../src/pages/Builder.tsx')
const layoutSrc = read('../src/components/Layout.tsx')

// Production (R846 build, Chrome): with `scroll-padding-top: 7rem` on <html>, focusing a
// control that sits in a stuck sticky bar centres it in the scrollport — the bar stays put
// and the page behind it moves. Measured before the fix:
//   1280×800  chip / health button focus  scrollY 2400 → 2021 (−379); header brand → 1972
//   375×812   chip focus                  scrollY 2000 → 1659 (−341); header → 1606
//   Shift+Tab across three chips          2400 → 2021 → 1642 → 1263 (cumulative)
//   health click → Escape (focus return)  2400 → 2021 → 1642
describe('R847: focus inside a stuck sticky bar keeps the page where it was', () => {
  it('restores the last settled scroll position when the browser moved the page under a stuck bar', () => {
    expect(stickyFocusRestore({ scrollY: 2021, lastScrollY: 2400, stuck: true })).toBe(2400)
    expect(stickyFocusRestore({ scrollY: 1659, lastScrollY: 2000, stuck: true })).toBe(2000)
    expect(stickyFocusRestore({ scrollY: 1972, lastScrollY: 2400, stuck: true })).toBe(2400)
  })

  it('leaves the page alone when nothing moved, when the bar is not stuck, or before any scroll was seen', () => {
    // focus at the top of the page, or with preventScroll
    expect(stickyFocusRestore({ scrollY: 2400, lastScrollY: 2400, stuck: true })).toBeNull()
    // the nav still sits in the document flow (below the fold at 375×500): the browser
    // scroll that brought the chip into view is legitimate — 0 → 274
    expect(stickyFocusRestore({ scrollY: 274, lastScrollY: 0, stuck: false })).toBeNull()
    expect(stickyFocusRestore({ scrollY: 274, lastScrollY: null, stuck: true })).toBeNull()
  })

  it('the Builder section nav and the site header install the guard', () => {
    const nav = builderSrc.slice(builderSrc.indexOf('function SectionNav('), builderSrc.indexOf('data-sticky-subnav'))
    expect(nav).toMatch(/keepPageStillOnFocus\(bar\.current\)/)
    expect(builderSrc).toMatch(/<nav\s+ref=\{bar\}\s+aria-label="Resume sections"\s+data-sticky-subnav/)
    expect(layoutSrc).toMatch(/keepPageStillOnFocus\(headerRef\.current\)/)
    expect(layoutSrc).toMatch(/<header ref=\{headerRef\} className={`[^`]*\bsticky top-0\b/)
  })
})
