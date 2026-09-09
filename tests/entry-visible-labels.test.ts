import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** Every `<Label htmlFor={`<prefix>-…-<field>`}>` in the Builder, keyed by prefix. */
const labelledFields = (prefix: string): Set<string> => {
  const re = new RegExp(`<Label htmlFor=\\{\`${prefix}-\\$\\{[a-z]+\\.id\\}-([a-z]+)\`\\}>`, 'g')
  return new Set([...builderSrc.matchAll(re)].map((m) => m[1]))
}

/** Every control `id={`<prefix>-…-<field>`}` (Input / textarea / MonthYearField). */
const controlIds = (prefix: string): Set<string> => {
  const re = new RegExp(`\\bid=\\{\`${prefix}-\\$\\{[a-z]+\\.id\\}-([a-z]+)\`\\}`, 'g')
  return new Set([...builderSrc.matchAll(re)].map((m) => m[1]))
}

// Experience / Education have carried visible conversational labels since R158
// ("Your role at {company}"); Involvement and Military service showed the same
// dated-entry layout with placeholders only, so a filled card read as two bare
// values side by side. Each control now has a visible <Label htmlFor> and no
// aria-label of its own (the label is the accessible name).
const EXPECTED: Record<string, string[]> = {
  exp: ['role', 'company', 'location', 'start', 'bullets'],
  edu: ['degree', 'school', 'location', 'start'],
  inv: ['role', 'organization', 'location', 'start', 'description'],
  mil: ['rank', 'branch', 'location', 'start', 'description'],
}

describe('R833: involvement / military cards label every field visibly, like experience / education', () => {
  it('each field has a visible <Label htmlFor> pointing at a control with that id', () => {
    for (const [prefix, fields] of Object.entries(EXPECTED)) {
      const labels = labelledFields(prefix)
      const ids = controlIds(prefix)
      for (const f of fields) {
        expect(labels.has(f), `${prefix}-${f} label`).toBe(true)
        expect(ids.has(f), `${prefix}-${f} control id`).toBe(true)
      }
    }
  })

  it('the labels name the organisation / branch once the user has typed it', () => {
    expect(builderSrc).toMatch(/`Your role at \$\{inv\.organization\.trim\(\)\}`/)
    expect(builderSrc).toMatch(/`When were you involved with \$\{inv\.organization\.trim\(\)\}\?`/)
    expect(builderSrc).toMatch(/`What did you do at \$\{inv\.organization\.trim\(\)\}\?`/)
    expect(builderSrc).toMatch(/`Your rank or position in the \$\{m\.branch\.trim\(\)\}`/)
    expect(builderSrc).toMatch(/`When did you serve in the \$\{m\.branch\.trim\(\)\}\?`/)
  })

  it('the placeholder-only aria-labels those controls used to carry are gone (label is the name)', () => {
    for (const name of [
      'Role',
      'Organization',
      'College or city (optional)',
      'Involvement description',
      'Rank or position',
      'Branch',
      'Stationed at',
      'Responsibilities and accomplishments',
    ]) {
      expect(builderSrc, name).not.toContain(`aria-label="${name}"`)
    }
  })

  it('the description label sits above the whole textarea + toolbar row, not inside the flex row', () => {
    for (const prefix of ['inv', 'mil']) {
      const at = builderSrc.indexOf(`<Label htmlFor={\`${prefix}-\${${prefix === 'inv' ? 'inv' : 'm'}.id}-description\`}>`)
      expect(at, prefix).toBeGreaterThan(-1)
      const rowAt = builderSrc.indexOf('<div className={ENTRY_TEXT_ROW}>', at)
      const nextLabel = builderSrc.indexOf('<Label ', at + 1)
      expect(rowAt).toBeGreaterThan(at)
      expect(nextLabel === -1 || nextLabel > rowAt).toBe(true)
    }
  })
})
