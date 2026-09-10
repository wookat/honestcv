import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

describe('R832: the reference e-mail / phone row splits 4:3 from sm up', () => {
  it('defines a 4fr / 3fr grid (the half-row 178 px box clipped 5 of 13 real addresses at 1024; 3fr/2fr left 137 px for a phone with an extension)', () => {
    expect(builderSrc).toContain(
      "const REFERENCE_CONTACT_ROW = 'grid gap-2 sm:grid-cols-[minmax(0,4fr)_minmax(0,3fr)]'",
    )
  })

  it('the row that holds the reference e-mail + phone uses it', () => {
    const email = builderSrc.indexOf('id={`ref-${ref.id}-email`}')
    expect(email).toBeGreaterThan(-1)
    // the e-mail control sits in a label+input wrapper; the wrapper sits in the 4:3 row
    const wrapOpen = builderSrc.lastIndexOf('<div className=', email)
    expect(builderSrc.slice(wrapOpen, builderSrc.indexOf('>', wrapOpen) + 1)).toBe(
      '<div className="space-y-1.5">',
    )
    const open = builderSrc.lastIndexOf('<div className=', wrapOpen - 1)
    const tag = builderSrc.slice(open, builderSrc.indexOf('>', open) + 1)
    expect(tag).toBe('<div className={REFERENCE_CONTACT_ROW}>')
    const phone = builderSrc.indexOf('id={`ref-${ref.id}-phone`}', email)
    expect(phone).toBeGreaterThan(email)
    // e-mail first (the 4fr column), phone second, no other grid opened between them
    expect(builderSrc.slice(email, phone)).not.toContain('<div className={')
  })
})
