import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** Position of the `<Label htmlFor={`<field>`}>` that names the control `field` (R835). */
const labelAt = (field: string): number => {
  const at = builderSrc.indexOf(`<Label htmlFor={\`${field}\`}>`)
  expect(at, field).toBeGreaterThan(-1)
  return at
}

/** The `<Input …/>` tag with `id={`<field>`}`. */
const inputTag = (field: string): string => {
  const at = builderSrc.indexOf(`id={\`${field}\`}`, labelAt(field))
  expect(at, field).toBeGreaterThan(-1)
  const open = builderSrc.lastIndexOf('<Input', at)
  const close = builderSrc.indexOf('/>', at)
  return builderSrc.slice(open, close)
}

/** The opening tag of the labelled wrapper `<div>` around `field` (label + input). */
const wrapperTag = (field: string): string => {
  const at = labelAt(field)
  const open = builderSrc.lastIndexOf('<div className=', at)
  return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
}

/** The opening tag of the grid that directly holds the wrapper around `field`. */
const wrappingGridTag = (field: string): string => {
  const wrapOpen = builderSrc.lastIndexOf('<div className=', labelAt(field))
  // Walk back over the wrapper's closed siblings until one more <div opens than closes.
  let depth = 0
  let pos = wrapOpen
  for (;;) {
    const open = builderSrc.lastIndexOf('<div', pos - 1)
    const close = builderSrc.lastIndexOf('</div>', pos - 1)
    if (close > open) {
      depth++
      pos = close
    } else {
      if (depth === 0) return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
      depth--
      pos = open
    }
  }
}

const ENTRIES: [name: string, org: string, when: string][] = [
  ['cw-${cw.id}-name', 'cw-${cw.id}-institution', 'cw-${cw.id}-date'],
  ['award-${a.id}-name', 'award-${a.id}-organization', 'award-${a.id}-date'],
  ['pub-${pub.id}-title', 'pub-${pub.id}-venue', 'pub-${pub.id}-date'],
  ['cert-${c.id}-name', 'cert-${c.id}-issuer', 'cert-${c.id}-date'],
]

describe('R816: one-line structured entries never clip the organisation field', () => {
  it('the organisation field is a direct child of the entry grid, not of a nested [1fr_5rem] row', () => {
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
    for (const [name, org, when] of ENTRIES) {
      expect(wrapperTag(name), name).toBe('<div className={`space-y-1.5 ${ENTRY_NAME_FIELD}`}>')
      expect(wrapperTag(org), org).toBe('<div className="space-y-1.5">')
      expect(inputTag(org), org).not.toMatch(/className=/)
      expect(inputTag(when), when).toMatch(/className=\{ENTRY_DATE_FIELD\}/)
    }
    // Publication type sits under the venue row and also spans the row
    expect(wrapperTag('pub-${pub.id}-kind')).toBe('<div className={`space-y-1.5 ${ENTRY_NAME_FIELD}`}>')
  })
})
