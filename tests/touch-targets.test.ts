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

/**
 * Every `<Button …>…</Button>` in the Builder, read with a brace-aware scanner so tags whose
 * handlers contain `=>` are not cut short (the R815 helper stops at the first `>`).
 */
const buttonElements = (): { tag: string; body: string; line: number }[] => {
  const out: { tag: string; body: string; line: number }[] = []
  let i = 0
  while ((i = builderSrc.indexOf('<Button', i)) !== -1) {
    if (!/[\s>]/.test(builderSrc[i + 7])) {
      i += 7
      continue
    }
    let j = i + 7
    let depth = 0
    let quote: string | null = null
    for (; j < builderSrc.length; j++) {
      const c = builderSrc[j]
      if (quote) {
        if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'" || c === '`') quote = c
      else if (c === '{') depth++
      else if (c === '}') depth--
      else if (c === '>' && depth === 0) break
    }
    const selfClosing = builderSrc[j - 1] === '/'
    const end = selfClosing ? j + 1 : builderSrc.indexOf('</Button>', j)
    out.push({
      tag: builderSrc.slice(i, j + 1),
      body: selfClosing ? '' : builderSrc.slice(j + 1, end),
      line: builderSrc.slice(0, i).split('\n').length,
    })
    i = end
  }
  return out
}
/** Children are one or more lucide icons (possibly behind a ternary) and no text at all. */
const iconOnly = (body: string) => {
  const b = body.trim()
  if (!/<[A-Z]\w*\b/.test(b)) return false
  const rest = b.replace(/<[A-Z]\w*\b[^>]*\/>/g, '')
  if (/['"]/.test(rest)) return false
  return /^[\s?:(){}]*$/.test(rest.replace(/\{[^{}?'"]*\?/g, '{'))
}
const className = (tag: string) => tag.match(/className="([^"]*)"/)?.[1] ?? ''
/**
 * The entry / section toolbars: icon-only `size="sm"` buttons that R815 gave a 40px mobile
 * height and a 28px (`sm:h-7`) or 36px (`sm:h-9` / `sm:min-h-9`) desktop height. Header
 * history buttons (`sm:min-h-8`), contact eyes (`size-10`) and the library Pencil / Copy
 * (`w-10`) are sized elsewhere and are not part of this contract.
 */
const entryToolbarButtons = () =>
  buttonElements().filter(
    (b) =>
      /size="sm"/.test(b.tag) &&
      iconOnly(b.body) &&
      /\b(min-)?h-10\b/.test(className(b.tag)) &&
      /\bsm:(min-)?h-[79]\b/.test(className(b.tag)) &&
      !/(^| )w-10( |$)/.test(className(b.tag)),
  )

describe('R834: entry toolbar buttons are 40px wide on touch widths', () => {
  const toolbar = entryToolbarButtons()

  it('finds the entry toolbars (move / duplicate / library / hide / delete / collapse)', () => {
    expect(toolbar.length).toBeGreaterThanOrEqual(70)
    const kinds = new Set(
      toolbar.flatMap(
        (b) =>
          b.body.match(/<(ArrowUp|ArrowDown|Copy|Trash2|Eye|EyeOff|BookmarkPlus|ChevronDown)\b/g) ?? [],
      ),
    )
    expect([...kinds].sort()).toEqual([
      '<ArrowDown',
      '<ArrowUp',
      '<BookmarkPlus',
      '<ChevronDown',
      '<Copy',
      '<Eye',
      '<EyeOff',
      '<Trash2',
    ])
  })

  it('every toolbar button declares the 40px mobile width and resets it above sm', () => {
    const offenders = toolbar
      .filter((b) => !/\bmin-w-10\b/.test(className(b.tag)) || !/\bsm:min-w-0\b/.test(className(b.tag)))
      .map((b) => `${b.line}: ${className(b.tag)}`)
    expect(offenders).toEqual([])
  })

  it('does not widen the shared Button size="sm" (px-3, no min width)', () => {
    const buttonSrc = readFileSync(
      path.resolve(import.meta.dirname, '../src/components/ui/button.tsx'),
      'utf8',
    )
    expect(buttonSrc).toMatch(/sm: 'h-8 rounded-md px-3 text-xs'/)
    expect(buttonSrc).not.toMatch(/min-w-10/)
  })

  it('seven-button card headers widen their toolbar row by the 6px card gutter below sm', () => {
    const rows = builderSrc.match(/className="ml-auto flex items-center max-sm:[^"]*"/g) ?? []
    expect(rows.length).toBe(2)
    for (const row of rows) {
      expect(row).toContain('max-sm:-mx-1.5')
      expect(row).toContain('max-sm:basis-[calc(100%+0.75rem)]')
      expect(row).toContain('max-sm:flex-wrap')
      expect(row).toContain('sm:shrink-0')
    }
  })
})
