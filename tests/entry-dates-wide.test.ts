import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** Source between the entry grid that contains `marker` and its next `<MonthYearField`. */
const gridAround = (marker: string): { grid: string; body: string } => {
  const at = builderSrc.indexOf(marker)
  expect(at, marker).toBeGreaterThan(-1)
  const open = builderSrc.lastIndexOf('<div className=', builderSrc.lastIndexOf('sm:grid-cols-2', at) + 1)
  const gridOpen = builderSrc.lastIndexOf('<div className={ENTRY_FIELDS_GRID}>', at)
  const start = Math.max(open, gridOpen)
  const end = builderSrc.indexOf('<MonthYearField', at)
  return { grid: builderSrc.slice(start, builderSrc.indexOf('>', start) + 1), body: builderSrc.slice(start, end) }
}

// Every structured entry whose start–end date pair shares a `sm:grid-cols-2`
// row with its location / organisation field, with the number of wide fields the
// grid holds (experience / education also widen their name pair — R829).
const DATED_ENTRIES: [string, number][] = [
  ['htmlFor={`exp-${e.id}-start`}', 4],
  ['htmlFor={`edu-${e.id}-start`}', 4],
  ['aria-label="Organization (optional)"', 2],
  ['aria-label="College or city (optional)"', 2],
  ['aria-label="Stationed at"', 2],
]

describe('R826: a dated entry never shows a quarter-width date box that clips "Jun 2023"', () => {
  it('the entry field grid is a size container that stays two columns from `sm` up', () => {
    const m = builderSrc.match(/const ENTRY_FIELDS_GRID = '([^']+)'/)
    expect(m).not.toBeNull()
    const cls = m![1].split(' ')
    expect(cls).toContain('@container')
    expect(cls).toContain('grid')
    expect(cls).toContain('sm:grid-cols-2')
    expect(cls.some((c) => /^grid-cols-/.test(c))).toBe(false)
  })

  it('the wide-field class spans every column only while the grid itself is narrower than 32rem', () => {
    // `col-span-full` (1 / -1) rather than `col-span-2`, so a one-column grid below `sm`
    // never gains an implicit second track; the query is on the grid, not the viewport.
    expect(builderSrc).toMatch(/const ENTRY_WIDE_FIELD = '@max-\[32rem\]:col-span-full'/)
  })

  it('every dated entry uses the shared grid and widens both the place field and the date pair', () => {
    for (const [marker, wideFields] of DATED_ENTRIES) {
      const { grid, body } = gridAround(marker)
      expect(grid, marker).toBe('<div className={ENTRY_FIELDS_GRID}>')
      const wide = body.match(/ENTRY_WIDE_FIELD/g) ?? []
      expect(wide.length, `${marker}: place field + date pair (+ name pair)`).toBe(wideFields)
    }
    // The remaining 2-column entry grids (reference email/phone, agents, project name row …) hold no date pair.
    const plainGrids = builderSrc.match(/className="grid gap-2 sm:grid-cols-2"/g) ?? []
    expect(plainGrids.length).toBe(5)
  })
})
