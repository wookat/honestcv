import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** Source offset of the reference control `id={`ref-${ref.id}-<field>`}` (R836 stable ids). */
const idAt = (field: string): number => {
  const at = builderSrc.indexOf(`id={\`ref-\${ref.id}-${field}\`}`)
  expect(at, field).toBeGreaterThan(-1)
  return at
}

/** The `<div className=…>` label+input wrapper that directly holds the control. */
const wrapperOf = (field: string): string => {
  const open = builderSrc.lastIndexOf('<div className=', idAt(field))
  return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
}

/** The `<div className=…>` grid that holds that wrapper (its parent's parent, depth-aware). */
const gridOf = (field: string): string => {
  let pos = idAt(field)
  let depth = 0
  for (let level = 0; level < 2; ) {
    const open = builderSrc.lastIndexOf('<div', pos)
    const close = builderSrc.lastIndexOf('</div>', pos)
    if (close > open) {
      depth++
      pos = close - 1
    } else {
      if (depth === 0) {
        level++
        if (level === 2) return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
      } else depth--
      pos = open - 1
    }
  }
  return ''
}

// A reference's job title and employer sat in a `grid-cols-2` nested inside one half of
// a `sm:grid-cols-2` row: 72 px inside at 1024 px, 104 px at 1280 and 375. The median
// real job title measures 122 px and the median employer 108 px (14px Inter), so
// `Engineering Manager` / `Northstar Digital` clipped at every viewport.
describe('R830: reference name takes the full row; job title / employer are the entry-grid pair', () => {
  it('the three fields sit directly in the container-query entry grid', () => {
    for (const field of ['name', 'title', 'employer']) {
      expect(gridOf(field), field).toBe('<div className={ENTRY_FIELDS_GRID}>')
    }
  })

  it('name spans the row; title and employer take a full row while the grid is narrower than 32rem', () => {
    expect(wrapperOf('name')).toContain('col-span-full')
    expect(wrapperOf('title')).toBe('<div className={`space-y-1.5 ${ENTRY_WIDE_FIELD}`}>')
    expect(wrapperOf('employer')).toBe('<div className={`space-y-1.5 ${ENTRY_WIDE_FIELD}`}>')
  })

  it('no nested quarter-width pair remains between name and job title', () => {
    expect(builderSrc.slice(idAt('name'), idAt('title'))).not.toContain('grid-cols-2')
  })
})
