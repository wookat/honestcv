import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EntryAuditChip } from '../src/components/EntryAuditChip'
import {
  AUDIT_CHIP_IDLE,
  type AuditChipEvent,
  auditChipReducer,
  auditChipVisible,
} from '../src/lib/auditChip'
import { popoverShift } from '../src/lib/popoverShift'

const chipSrc = readFileSync(
  new URL('../src/components/EntryAuditChip.tsx', import.meta.url),
  'utf8',
)

const after = (events: AuditChipEvent[]) => events.reduce(auditChipReducer, AUDIT_CHIP_IDLE)

/** What Chrome emits on the chip for a first touch tap (measured on production, R817):
 * mouseenter → focus → click → mouseleave. A second tap on the still-focused chip is
 * mouseenter → click with no blur and no mouseleave; a third tap is click alone. */
const TAP: AuditChipEvent[] = ['enter', 'focus', 'toggle', 'leave']
const TAP_AGAIN: AuditChipEvent[] = ['enter', 'toggle']
const TAP_THIRD: AuditChipEvent[] = ['toggle']

const chip = (over: Partial<Parameters<typeof EntryAuditChip>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(EntryAuditChip, {
      findings: [{ category: 'Weak bullet points', line: 2 }],
      filled: true,
      checks: ['Dates are missing', 'Weak bullet points'],
      expandable: false,
      onExpand: () => {},
      label: 'Role 1',
      ...over,
    }),
  )

describe('R817: entry audit chip opens on a tap and reads as a button', () => {
  it('a touch tap leaves the panel open, a second tap on the focused chip closes it, a third reopens it', () => {
    expect(auditChipVisible(after(TAP))).toBe(true)
    expect(auditChipVisible(after([...TAP, ...TAP_AGAIN]))).toBe(false)
    expect(auditChipVisible(after([...TAP, ...TAP_AGAIN, ...TAP_THIRD]))).toBe(true)
    // desktop: hover shows, a click pins it through pointer leave, a second click hides it while hovering
    expect(auditChipVisible(after(['enter', 'toggle', 'leave']))).toBe(true)
    expect(auditChipVisible(after(['enter', 'toggle', 'toggle']))).toBe(false)
    expect(auditChipVisible(after(['enter', 'toggle', 'toggle', 'leave', 'enter']))).toBe(true)
    // hover alone (no click) still shows and hides with the pointer
    expect(auditChipVisible(after(['enter']))).toBe(true)
    expect(auditChipVisible(after(['enter', 'leave']))).toBe(false)
  })

  it('a tap outside, blur or Escape closes a pinned panel; the next hover or click reopens it', () => {
    expect(auditChipVisible(after([...TAP, 'outside']))).toBe(false)
    expect(auditChipVisible(after([...TAP, 'blur']))).toBe(false)
    expect(auditChipVisible(after(['enter', 'focus', 'toggle', 'escape']))).toBe(false)
    expect(auditChipVisible(after(['enter', 'focus', 'toggle', 'escape', 'toggle']))).toBe(true)
    // Escape while hovering stays dismissed until the pointer leaves and returns (R691)
    expect(auditChipVisible(after(['enter', 'escape']))).toBe(false)
    expect(auditChipVisible(after(['enter', 'escape', 'leave', 'enter']))).toBe(true)
  })

  it('the chip is a <button> that names the panel it controls; the panel is not aria-hidden', () => {
    for (const html of [
      chip(),
      chip({ findings: [] }),
      chip({ expandable: true }),
    ]) {
      const button = html.match(/<button[^>]*>/)?.[0] ?? ''
      expect(button).toMatch(/type="button"/)
      expect(button).toMatch(/aria-label="Role 1: /)
      expect(button).toMatch(/aria-expanded="false"/)
      const id = button.match(/aria-controls="([^"]+)"/)?.[1]
      expect(id).toBeTruthy()
      expect(html).toContain(`id="${id}"`)
      expect(html).not.toMatch(/aria-hidden/)
      expect(html).not.toMatch(/<span[^>]*tabindex/)
    }
    expect(chip({ findings: [] })).toMatch(/aria-label="Role 1: 2 best practices applied"/)
    expect(chip()).toMatch(/aria-label="Role 1: 1 suggestion"/)
    expect(chip({ expandable: true })).toMatch(/aria-label="Role 1: 1 suggestion — expand to review"/)
    expect(chip({ findings: [], filled: false })).toBe('')
  })

  it('the button is a 40px square on touch widths and at least 24px square from sm up (R843)', () => {
    const button = chip().match(/<button[^>]*>/)?.[0] ?? ''
    const cls = button.match(/class="([^"]+)"/)?.[1].split(' ') ?? []
    expect(cls).toEqual(expect.arrayContaining(['min-h-10', 'min-w-10', 'sm:min-h-6', 'sm:min-w-6']))
    // WCAG 2.5.8: the badge alone measured 29.9 × 17.3 on production at ≥ sm (R842 axe)
    expect(cls).not.toEqual(expect.arrayContaining(['sm:min-h-0']))
    expect(cls).not.toEqual(expect.arrayContaining(['sm:min-w-0']))
    // the coloured badge keeps its compact size inside the button
    const badge = (html: string) => html.match(/<button[^>]*><span class="([^"]+)"/)?.[1].split(' ') ?? []
    expect(badge(chip())).toEqual(
      expect.arrayContaining(['px-1.5', 'py-0.5', 'text-[10px]', 'bg-amber-50', 'text-amber-700']),
    )
    expect(badge(chip({ findings: [] }))).toEqual(
      expect.arrayContaining(['px-1.5', 'py-0.5', 'text-[10px]', 'bg-emerald-50', 'text-emerald-700']),
    )
  })
})

describe('R844: the findings panel stays inside the viewport from sm up', () => {
  it('a right-anchored 256px panel on a chip near the card edge is shifted right, margin kept', () => {
    // measured on production (1280 / 1024 / 768, one-letter titles): chip right edge 177.8 / 180.2 / 208
    expect(popoverShift({ left: 177.75 - 256, right: 177.75 }, 1265)).toBeCloseTo(86.25)
    expect(popoverShift({ left: 180.17 - 256, right: 180.17 }, 1009)).toBeCloseTo(83.83)
    expect(popoverShift({ left: 207.98 - 256, right: 207.98 }, 753)).toBeCloseTo(56.02)
    // natural titles already fit: Role 1 panel 132.4..388.4 at 1280, Education 228..484
    expect(popoverShift({ left: 132.4, right: 388.4 }, 1265)).toBe(0)
    expect(popoverShift({ left: 228, right: 484 }, 1265)).toBe(0)
  })

  it('the chip measures the untransformed panel from its anchor, applies the shift as a transform, and leaves the fixed mobile strip alone', () => {
    expect(chipSrc).toContain("import { popoverShift } from '@/lib/popoverShift'")
    expect(chipSrc).toMatch(/useLayoutEffect\(\(\) => \{\s*if \(!visible\) return/)
    expect(chipSrc).toMatch(
      /if \(getComputedStyle\(panel\)\.position !== 'absolute'\) \{\s*setShift\(0\)\s*return\s*\}/,
    )
    expect(chipSrc).toMatch(
      /popoverShift\(\s*\{ left: right - panel\.offsetWidth, right \},\s*document\.documentElement\.clientWidth,?\s*\)/,
    )
    expect(chipSrc).toContain("window.addEventListener('resize', place)")
    expect(chipSrc).toContain('style={shift ? { transform: `translateX(${shift}px)` } : undefined}')
    // the panel keeps its mobile strip and its desktop right anchor + width (R691 / R817 / R843)
    const panel = chip().match(/<div id="[^"]+" class="([^"]+)"/)?.[1].split(' ') ?? []
    expect(panel).toEqual(
      expect.arrayContaining([
        'fixed',
        'inset-x-4',
        'bottom-20',
        'z-40',
        'sm:absolute',
        'sm:inset-x-auto',
        'sm:top-full',
        'sm:right-0',
        'sm:mt-1',
        'sm:w-64',
      ]),
    )
    // hidden panel carries no transform until it is measured
    expect(chip()).not.toMatch(/translateX/)
  })
})
