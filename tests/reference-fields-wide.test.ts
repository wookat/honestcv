import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** The `<Input …>` tag whose aria-label is `label`. */
const inputOf = (label: string): string => {
  const at = builderSrc.indexOf(`aria-label="${label}"`)
  expect(at, label).toBeGreaterThan(-1)
  const open = builderSrc.lastIndexOf('<Input', at)
  return builderSrc.slice(open, builderSrc.indexOf('/>', open) + 2)
}

/** The `<div className=…>` grid that directly holds the Input with this aria-label. */
const gridOf = (label: string): string => {
  const at = builderSrc.indexOf(`aria-label="${label}"`)
  const open = builderSrc.lastIndexOf('<div className=', at)
  return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
}

// A reference's job title and employer sat in a `grid-cols-2` nested inside one half of
// a `sm:grid-cols-2` row: 72 px inside at 1024 px, 104 px at 1280 and 375. The median
// real job title measures 122 px and the median employer 108 px (14px Inter), so
// `Engineering Manager` / `Northstar Digital` clipped at every viewport.
describe('R830: reference name takes the full row; job title / employer are the entry-grid pair', () => {
  it('the three fields sit directly in the container-query entry grid', () => {
    for (const label of ['Reference full name', 'Reference job title', 'Reference employer']) {
      expect(gridOf(label), label).toBe('<div className={ENTRY_FIELDS_GRID}>')
    }
  })

  it('name spans the row; title and employer take a full row while the grid is narrower than 32rem', () => {
    expect(inputOf('Reference full name')).toContain('className="col-span-full"')
    expect(inputOf('Reference job title')).toContain('className={ENTRY_WIDE_FIELD}')
    expect(inputOf('Reference employer')).toContain('className={ENTRY_WIDE_FIELD}')
  })

  it('no nested quarter-width pair remains between name and job title', () => {
    const name = builderSrc.indexOf('aria-label="Reference full name"')
    const title = builderSrc.indexOf('aria-label="Reference job title"')
    expect(builderSrc.slice(name, title)).not.toContain('grid-cols-2')
  })
})
