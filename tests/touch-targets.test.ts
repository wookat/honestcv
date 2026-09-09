import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MonthYearField } from '../src/components/MonthYearField'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

/** Every `<Button …>` opening tag in the Builder with the JSX line that follows it. */
const buttons = (): { tag: string; body: string }[] => {
  const out: { tag: string; body: string }[] = []
  const re = /<Button\b([^>]*)>([^<]*(?:<[A-Za-z][^>]*\/>[^<]*)?)/g
  for (const m of builderSrc.matchAll(re)) out.push({ tag: m[1], body: m[2] })
  return out
}
const hasMobileHeight = (tag: string) =>
  /\b(min-h-10|h-10)\b/.test(tag) && /\bsm:(min-)?h-\d/.test(tag)

describe('R815: Builder controls reach 40px on touch widths', () => {
  it('every "Add …" / "From library" section button opts into the mobile min height', () => {
    const list = buttons().filter(
      (b) => /size="sm"/.test(b.tag) && /(<Plus [^>]*\/>\s*Add |From library \()/.test(b.body),
    )
    expect(list.length).toBeGreaterThanOrEqual(20)
    const offenders = list.filter((b) => !hasMobileHeight(b.tag)).map((b) => b.body.trim())
    expect(offenders).toEqual([])
  })

  it('no entry toolbar button is a fixed 36px (`h-9`) at every width', () => {
    const fixed = buttons().filter(
      (b) => /className="(?:[^"]* )?h-9(?: [^"]*)?"/.test(b.tag) && !/ sm:h-9\b/.test(b.tag),
    )
    expect(fixed.map((b) => b.tag.trim())).toEqual([])
  })

  it('contact Hide/Show toggles are 40px squares on touch widths without growing the row', () => {
    const eye = buttons().filter((b) => /aria-pressed=\{fieldHidden\}/.test(b.tag))
    expect(eye.length).toBe(1)
    expect(eye[0].tag).toMatch(/\bsize-10\b/)
    expect(eye[0].tag).toMatch(/ -my-2 /)
    expect(eye[0].tag).toMatch(/ sm:size-6"/)
  })
})

describe('R815: MonthYearField picker trigger', () => {
  const html = renderToStaticMarkup(
    createElement(MonthYearField, {
      value: 'Jan 2020',
      onChange: () => {},
      ariaLabel: 'Start date',
    }),
  )
  it('is 40px wide and tall on touch widths, 32px inside the field on desktop', () => {
    const trigger = html.match(/<button[^>]*aria-label="Open date picker"[^>]*>/)?.[0] ?? ''
    expect(trigger).toMatch(/\bw-10\b/)
    expect(trigger).toMatch(/ -inset-y-0\.5 /)
    expect(trigger).toMatch(/\bsm:w-8\b/)
    expect(trigger).toMatch(/\bsm:inset-y-0\b/)
  })
  it('reserves matching room in the input so typed text never sits under the trigger', () => {
    const input = html.match(/<input[^>]*>/)?.[0] ?? ''
    expect(input).toMatch(/\bpr-10\b/)
    expect(input).toMatch(/\bsm:pr-8\b/)
  })
})
