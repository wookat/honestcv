import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** The `<Input …/>` tag carrying `aria-label="<label>"` (first occurrence). */
const inputTag = (label: string): string => {
  const at = builderSrc.indexOf(`aria-label="${label}"`)
  expect(at, label).toBeGreaterThan(-1)
  const open = builderSrc.lastIndexOf('<Input', at)
  const close = builderSrc.indexOf('/>', at)
  return builderSrc.slice(open, close)
}

/** The opening tag of the grid that directly wraps the input labelled `label`. */
const wrappingGridTag = (label: string): string => {
  const at = builderSrc.indexOf(`aria-label="${label}"`)
  const open = builderSrc.lastIndexOf('<div className=', at)
  return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
}

const ENTRIES: [name: string, org: string][] = [
  ['Course name', 'Where (school or platform)'],
  ['Award name', 'Awarded by'],
  ['Publication title', 'Journal or conference'],
  ['Certificate name', 'Issuer'],
]

describe('R816: one-line structured entries never clip the organisation field', () => {
  it('the organisation input is a direct child of the entry grid, not of a nested [1fr_5rem] row', () => {
    for (const [name, org] of ENTRIES) {
      const grid = wrappingGridTag(org)
      expect(grid, org).toBe('<div className={ENTRY_NAME_ORG_DATE}>')
      expect(wrappingGridTag(name), name).toBe(grid)
    }
    expect(builderSrc).not.toMatch(/grid-cols-\[1fr_5rem\]/)
  })

  it('the entry grid stacks below `sm` and gives the organisation the flexible column from `sm` up', () => {
    const m = builderSrc.match(/const ENTRY_NAME_ORG_DATE = '([^']+)'/)
    expect(m).not.toBeNull()
    const cls = m![1].split(' ')
    expect(cls).toContain('grid')
    expect(cls.some((c) => /^grid-cols-/.test(c))).toBe(false)
    expect(cls).toContain('sm:grid-cols-[minmax(0,1fr)_auto]')
  })

  it('the name takes the full row from `sm` up and the date box is compact at every width', () => {
    expect(builderSrc).toMatch(/const ENTRY_NAME_FIELD = 'sm:col-span-2'/)
    expect(builderSrc).toMatch(/const ENTRY_DATE_FIELD = 'w-32 sm:w-24'/)
    for (const [name, org] of ENTRIES) {
      expect(inputTag(name), name).toMatch(/className=\{ENTRY_NAME_FIELD\}/)
      expect(inputTag(org), org).not.toMatch(/className=/)
      const whenAt = builderSrc.indexOf('aria-label="When"', builderSrc.indexOf(`aria-label="${org}"`))
      const when = builderSrc.slice(builderSrc.lastIndexOf('<Input', whenAt), builderSrc.indexOf('/>', whenAt))
      expect(when, `${org} → When`).toMatch(/className=\{ENTRY_DATE_FIELD\}/)
    }
    // Publication type sits under the venue row and also spans the row
    expect(inputTag('Publication type')).toMatch(/className=\{ENTRY_NAME_FIELD\}/)
  })
})
