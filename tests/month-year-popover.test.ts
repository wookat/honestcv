import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { POPOVER_VIEWPORT_MARGIN, popoverShift } from '../src/lib/popoverShift'

const fieldSrc = readFileSync(
  new URL('../src/components/MonthYearField.tsx', import.meta.url),
  'utf8',
)

describe('R827: the month-year picker popover stays inside the viewport', () => {
  it('a start-date popover that would open off the left edge at 375 is shifted right, margin kept', () => {
    // measured on production at 375×667: 224px popover right-anchored to the start field ends at x=176
    expect(popoverShift({ left: -48, right: 176 }, 375)).toBe(48 + POPOVER_VIEWPORT_MARGIN)
    // the end field's popover (90..314) already fits
    expect(popoverShift({ left: 90, right: 314 }, 375)).toBe(0)
  })

  it('a popover that would overflow the right edge is shifted left; one that fits is left alone', () => {
    expect(popoverShift({ left: 1100, right: 1324 }, 1280)).toBe(
      1280 - POPOVER_VIEWPORT_MARGIN - 1324,
    )
    expect(popoverShift({ left: 26, right: 250 }, 1024)).toBe(0)
    expect(popoverShift({ left: 228, right: 452 }, 1280)).toBe(0)
  })

  it('the field measures the untransformed popover from its anchor and applies the shift as a transform', () => {
    expect(fieldSrc).toContain("import { popoverShift } from '@/lib/popoverShift'")
    expect(fieldSrc).toMatch(/useLayoutEffect\(\(\) => \{\s*if \(!open\) return/)
    expect(fieldSrc).toMatch(
      /popoverShift\(\s*\{ left: right - pop\.offsetWidth, right \},\s*document\.documentElement\.clientWidth,?\s*\)/,
    )
    expect(fieldSrc).toContain("window.addEventListener('resize', place)")
    expect(fieldSrc).toContain(
      'style={shift ? { transform: `translateX(${shift}px)` } : undefined}',
    )
    // the popover itself keeps its right anchor and width
    expect(fieldSrc).toMatch(/className="bg-background absolute right-0 top-full z-30 mt-1 w-56 /)
  })
})
