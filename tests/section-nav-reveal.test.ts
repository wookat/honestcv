import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { REVEAL_SCROLL_MARGIN, revealScrollLeft } from '../src/lib/revealScroll'

const builderSrc = readFileSync(new URL('../src/pages/Builder.tsx', import.meta.url), 'utf8')

// Builder section nav measured on production at 375 (R845 build): 7 chips in a 490 px strip,
// 262 px visible; at 1024 the strip shows 332 px. Chip content offsets (left, right):
const CHIP = {
  Contact: { left: 0, right: 65 },
  Experience: { left: 143, right: 227 },
  Education: { left: 229, right: 305 },
  Skills: { left: 375, right: 425 },
  Custom: { left: 427, right: 490 },
}
const strip = (clientWidth: number, scrollLeft = 0) => ({ scrollLeft, clientWidth, scrollWidth: 490 })

describe('R846: the sticky section nav scrolls its highlighted chip into view', () => {
  it('a chip hidden past the right edge is revealed with an 8 px margin; a visible chip leaves scrollLeft alone', () => {
    expect(REVEAL_SCROLL_MARGIN).toBe(8)
    // 375: Education is the current section at y ≈ 3500 but sat at 229..305 in a 262 px window
    expect(revealScrollLeft(strip(262), CHIP.Education)).toBe(305 + 8 - 262)
    // Skills at y ≈ 4200, after Education had already been revealed (scrollLeft 51)
    expect(revealScrollLeft(strip(262, 51), CHIP.Skills)).toBe(425 + 8 - 262)
    // 1024: Skills at 375..425 in a 332 px window
    expect(revealScrollLeft(strip(332), CHIP.Skills)).toBe(101)
    // already showing: Contact / Experience at scrollLeft 0, Education at 1024
    expect(revealScrollLeft(strip(262), CHIP.Contact)).toBe(0)
    expect(revealScrollLeft(strip(262), CHIP.Experience)).toBe(0)
    expect(revealScrollLeft(strip(332), CHIP.Education)).toBe(0)
  })

  it('the last chip clamps to the strip end and a chip hidden past the left edge scrolls back', () => {
    // Custom wants 490 + 8 − 262 = 236 but the strip only scrolls to 490 − 262 = 228
    expect(revealScrollLeft(strip(262, 171), CHIP.Custom)).toBe(228)
    expect(revealScrollLeft(strip(332, 101), CHIP.Custom)).toBe(158)
    // scrolling back up to Contact after Custom was revealed
    expect(revealScrollLeft(strip(262, 228), CHIP.Contact)).toBe(0)
    expect(revealScrollLeft(strip(262, 228), CHIP.Experience)).toBe(143 - 8)
    // a strip that does not overflow never scrolls
    expect(revealScrollLeft({ scrollLeft: 0, clientWidth: 600, scrollWidth: 490 }, CHIP.Custom)).toBe(0)
  })

  it('SectionNav re-measures the aria-current chip whenever the active section changes and scrolls the strip, not the page', () => {
    expect(builderSrc).toContain("import { revealScrollLeft } from '@/lib/revealScroll'")
    const nav = builderSrc.slice(builderSrc.indexOf('function SectionNav('), builderSrc.indexOf('const scoreVerdict ='))
    expect(nav).toContain('const scroller = useRef<HTMLDivElement>(null)')
    expect(nav).toMatch(/querySelector<HTMLElement>\('\[aria-current="true"\]'\)/)
    expect(nav).toMatch(/revealScrollLeft\(box, \{\s*left: r\.left - boxLeft \+ box\.scrollLeft,\s*right: r\.right - boxLeft \+ box\.scrollLeft,\s*\}\)/)
    expect(nav).toMatch(/box\.scrollTo\(\{ left, behavior: prefersReducedMotion\(\) \? 'auto' : 'smooth' \}\)/)
    expect(nav).toMatch(/\}, \[active\]\)/)
    expect(nav).not.toMatch(/scrollIntoView/)
    expect(nav).toContain('ref={scroller} className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]"')
  })
})
