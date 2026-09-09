import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** The Contact section's field tuple list (`['fullName', 'Full name', …] … as const`). */
const contactFields = (): string[] => {
  const start = builderSrc.indexOf("['fullName', 'Full name'")
  expect(start).toBeGreaterThan(-1)
  const end = builderSrc.indexOf('] as const', start)
  return [...builderSrc.slice(start, end).matchAll(/\['(\w+)', '/g)].map((m) => m[1])
}

describe('R831: the Contact LinkedIn field spans the whole row', () => {
  it('LinkedIn is the seventh, last contact field — alone on the final row of the 2-column grid', () => {
    const fields = contactFields()
    expect(fields.length % 2).toBe(1)
    expect(fields[fields.length - 1]).toBe('linkedin')
  })

  it('its cell wrapper gets col-span-full (the half-width cell clipped 13 of 21 real profile URLs at 1024)', () => {
    const start = builderSrc.indexOf("['fullName', 'Full name'")
    const wrapper = builderSrc.indexOf('<div\n                    key={key}', start)
    expect(wrapper).toBeGreaterThan(-1)
    const tag = builderSrc.slice(wrapper, builderSrc.indexOf('>', wrapper) + 1)
    expect(tag).toContain("${key === 'linkedin' ? 'col-span-full' : ''}")
  })
})
