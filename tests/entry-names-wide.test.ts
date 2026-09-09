import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** The `<div className=…>` wrapper that holds the Input with this id. */
const wrapperOf = (inputId: string): string => {
  const at = builderSrc.indexOf(`id={\`${inputId}\`}`)
  expect(at, inputId).toBeGreaterThan(-1)
  const open = builderSrc.lastIndexOf('<div className=', at)
  return builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
}

// Experience role / company and education degree / school share a `sm:grid-cols-2`
// row inside the entry grid; at 1024 px (editor beside the preview) each box is
// 178 px inside — narrower than 90 of 201 real school names and 53 of 503 roles.
const NAME_FIELDS = ['exp-${e.id}-role', 'exp-${e.id}-company', 'edu-${e.id}-degree', 'edu-${e.id}-school']

describe('R829: role / company and degree / school take a full row while the entry grid is narrower than 32rem', () => {
  it('each name field wrapper carries the container-query wide class', () => {
    for (const id of NAME_FIELDS) {
      expect(wrapperOf(id), id).toBe('<div className={`space-y-1.5 ${ENTRY_WIDE_FIELD}`}>')
    }
  })

  it('the wide class is still the grid-scoped query R826 introduced (not a viewport breakpoint)', () => {
    expect(builderSrc).toMatch(/const ENTRY_WIDE_FIELD = '@max-\[32rem\]:col-span-full'/)
    expect(builderSrc).not.toMatch(/lg:col-span-full|xl:col-span-full/)
  })
})
