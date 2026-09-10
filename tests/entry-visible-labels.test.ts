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
      const rowAt = builderSrc.indexOf('<div className={ENTRY_TEXT_STACK}>', at)
      const nextLabel = builderSrc.indexOf('<Label ', at + 1)
      expect(rowAt).toBeGreaterThan(at)
      expect(nextLabel === -1 || nextLabel > rowAt).toBe(true)
    }
  })
})

// The four one-line entry cards (coursework / award / publication / certification)
// were the remaining structured cards whose only naming was the placeholder that
// vanishes once the user types — a filled card read "Dean's List · University of
// Texas at Austin · 2019" with nothing saying which box is which.
const ONE_LINE: Record<string, { item: string; fields: string[] }> = {
  cw: { item: 'cw', fields: ['name', 'institution', 'date', 'skill', 'description'] },
  award: { item: 'a', fields: ['name', 'organization', 'date', 'description'] },
  pub: { item: 'pub', fields: ['title', 'venue', 'date', 'kind', 'description'] },
  cert: { item: 'c', fields: ['name', 'issuer', 'date', 'description'] },
}

describe('R835: coursework / award / publication / certification cards label every field visibly', () => {
  it('each field has a visible <Label htmlFor> pointing at a control with that id', () => {
    for (const [prefix, { fields }] of Object.entries(ONE_LINE)) {
      const labels = labelledFields(prefix)
      const ids = controlIds(prefix)
      expect([...labels].sort(), `${prefix} labels`).toEqual([...fields].sort())
      for (const f of fields) expect(ids.has(f), `${prefix}-${f} control id`).toBe(true)
    }
  })

  it('the placeholder-only aria-labels those controls used to carry are gone (label is the name)', () => {
    for (const name of [
      'Course name',
      'Where (school or platform)',
      'When',
      'Skills used (optional)',
      'How you applied it',
      'Award name',
      'Awarded by',
      "Why it's relevant",
      'Publication title',
      'Journal or conference',
      'Publication type',
      'Additional information',
      'Certificate name',
      'Issuer',
      "How it's relevant (optional)",
    ]) {
      expect(builderSrc, name).not.toContain(`aria-label="${name}"`)
    }
  })

  it('the compact date box keeps its width and its label sits on the organisation baseline from sm up', () => {
    expect(builderSrc).toMatch(/const ENTRY_DATE_WRAP = 'space-y-1\.5 sm:self-end'/)
    for (const [prefix, { item }] of Object.entries(ONE_LINE)) {
      const at = builderSrc.indexOf(`<Label htmlFor={\`${prefix}-\${${item}.id}-date\`}>When?</Label>`)
      expect(at, prefix).toBeGreaterThan(-1)
      const wrapOpen = builderSrc.lastIndexOf('<div className=', at)
      expect(builderSrc.slice(wrapOpen, builderSrc.indexOf('>', wrapOpen) + 1)).toBe(
        '<div className={ENTRY_DATE_WRAP}>',
      )
      const input = builderSrc.slice(at, builderSrc.indexOf('/>', at))
      expect(input, `${prefix} date input`).toMatch(/className=\{ENTRY_DATE_FIELD\}/)
    }
  })

  it('the description label sits above the whole textarea + toolbar row, not inside the flex row', () => {
    for (const [prefix, { item }] of Object.entries(ONE_LINE)) {
      const at = builderSrc.indexOf(`<Label htmlFor={\`${prefix}-\${${item}.id}-description\`}>`)
      expect(at, prefix).toBeGreaterThan(-1)
      const rowAt = builderSrc.indexOf('<div className={ENTRY_TEXT_STACK}>', at)
      const nextLabel = builderSrc.indexOf('<Label ', at + 1)
      expect(rowAt).toBeGreaterThan(at)
      expect(nextLabel === -1 || nextLabel > rowAt).toBe(true)
    }
  })
})

// After R835 the production label audit still listed eight text controls with no
// visible caption: the five reference fields and the education GPA / Minor / Details
// boxes. A filled reference read "Priya Natarajan · Engineering Manager · Northstar
// Digital · priya.natarajan@… · (555) …" with nothing saying which box is which.
describe('R836: reference cards and the education GPA / Minor / Details boxes label every field visibly', () => {
  it('each reference field has a visible <Label htmlFor> pointing at a control with that id', () => {
    const fields = ['name', 'title', 'employer', 'email', 'phone']
    expect([...labelledFields('ref')].sort()).toEqual([...fields].sort())
    const ids = controlIds('ref')
    for (const f of fields) expect(ids.has(f), `ref-${f} control id`).toBe(true)
  })

  it('the job-title / employer labels name the person once the user has typed the name', () => {
    expect(builderSrc).toMatch(/`\$\{ref\.name\.trim\(\)\}'s job title` : 'Their job title'/)
    expect(builderSrc).toMatch(/`Where does \$\{ref\.name\.trim\(\)\} work\?` : 'Where do they work\?'/)
  })

  it('education GPA / Minor / Details have visible labels with matching ids', () => {
    const labels = labelledFields('edu')
    const ids = controlIds('edu')
    for (const f of ['gpa', 'minor', 'details']) {
      expect(labels.has(f), `edu-${f} label`).toBe(true)
      expect(ids.has(f), `edu-${f} control id`).toBe(true)
    }
  })

  it('the details label sits above the whole text box + toolbar row, not inside the flex row', () => {
    const at = builderSrc.indexOf('<Label htmlFor={`edu-${e.id}-details`}>')
    expect(at).toBeGreaterThan(-1)
    const rowAt = builderSrc.indexOf('<div className={ENTRY_TEXT_STACK}>', at)
    const nextLabel = builderSrc.indexOf('<Label ', at + 1)
    expect(rowAt).toBeGreaterThan(at)
    expect(nextLabel === -1 || nextLabel > rowAt).toBe(true)
  })

  it('the placeholder-only aria-labels those controls used to carry are gone (label is the name)', () => {
    for (const name of [
      'Reference full name',
      'Reference job title',
      'Reference employer',
      'Reference email',
      'Reference phone',
      'GPA (optional)',
      'Minor (optional)',
      'Education details (optional)',
    ]) {
      expect(builderSrc, name).not.toContain(`aria-label="${name}"`)
    }
  })
})

// After R836 the audit's "deferred" list still held the custom-section card: its title
// Input and entries Textarea were named only by aria-labels that repeat the placeholder,
// and its Delete button had a bare `title`. With two custom sections on production
// (R841 bundle) every one of the three names was duplicated and none said which section
// it belonged to; a filled card read "Volunteering" over an unnamed multi-line box.
describe('R842: custom-section cards label title / entries visibly and the Delete button names its section', () => {
  it('title and entries have a visible <Label htmlFor> pointing at a control with that id', () => {
    expect([...labelledFields('custom')].sort()).toEqual(['entries', 'title'])
    const ids = controlIds('custom')
    for (const f of ['title', 'entries']) expect(ids.has(f), `custom-${f} control id`).toBe(true)
  })

  it('the entries label names the section once the user has typed its title', () => {
    expect(builderSrc).toMatch(
      /`\$\{s\.title\.trim\(\)\} entries \(one per line\)`\s*:\s*'Entries \(one per line\)'/,
    )
  })

  it('the Delete button names the section it deletes (title, or its position while untitled)', () => {
    expect(builderSrc).toMatch(
      /`Delete \$\{s\.title\.trim\(\)\} section`\s*:\s*`Delete custom section \$\{idx \+ 1\}`/,
    )
    expect(builderSrc).toMatch(/resume\.customSections\.map\(\(s, idx\) =>/)
  })

  it('the placeholder-style aria-labels those controls used to carry are gone (label is the name)', () => {
    for (const name of ['Section title', 'Section entries, one per line']) {
      expect(builderSrc, name).not.toContain(`aria-label="${name}"`)
    }
  })

  it('the title row aligns the Delete button with the input, not the label + input pair', () => {
    const at = builderSrc.indexOf('<Label htmlFor={`custom-${s.id}-title`}>')
    expect(at).toBeGreaterThan(-1)
    const row = builderSrc.lastIndexOf('<div className="flex ', at)
    expect(builderSrc.slice(row, builderSrc.indexOf('>', row) + 1)).toBe(
      '<div className="flex items-end justify-between gap-2">',
    )
    const wrap = builderSrc.lastIndexOf('<div className=', at)
    expect(builderSrc.slice(wrap, builderSrc.indexOf('>', wrap) + 1)).toBe(
      '<div className="min-w-0 flex-1 space-y-1.5">',
    )
  })

  it('a caption that interpolates user text can break inside an unbroken word (Label is a flex box)', () => {
    const labelSrc = readFileSync(
      path.resolve(import.meta.dirname, '../src/components/ui/label.tsx'),
      'utf8',
    )
    const base = labelSrc.match(/'flex [^']*'/)?.[0] ?? ''
    expect(base).toContain('wrap-anywhere')
  })
})
