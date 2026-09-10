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
