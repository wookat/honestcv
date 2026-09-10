import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = readFileSync(path.resolve(import.meta.dirname, '../src/pages/Dashboard.tsx'), 'utf8')

/** The /samples grid card: from the map callback to the closing `))}`. */
const card = (): string => {
  const start = src.indexOf('{filteredExamples.slice(0, 9).map((e) => (')
  const end = src.indexOf('\n                ))}', start)
  if (start < 0 || end < 0) throw new Error('sample card markup not found')
  return src.slice(start, end)
}

/** Every `<button` / `<Link` opening tag in `block`, closed at the first `>` outside `{…}`. */
const openingTags = (block: string): { name: string; tag: string; index: number }[] => {
  const out: { name: string; tag: string; index: number }[] = []
  for (const m of block.matchAll(/<(button|Link)\b/g)) {
    let depth = 0
    let i = m.index + m[0].length
    for (; i < block.length; i++) {
      const ch = block[i]
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) break
    }
    out.push({ name: m[1], tag: block.slice(m.index, i + 1), index: m.index })
  }
  return out
}

/** Opening tag of a `<button` / `<Link` whose attributes or the 200 chars after it match `marker`. */
const openingTag = (block: string, marker: RegExp): string => {
  const hit = openingTags(block).find((t) =>
    marker.test(block.slice(t.index, t.index + t.tag.length + 200)),
  )
  if (!hit) throw new Error(`tag not found: ${marker}`)
  return hit.tag
}

describe('R841: /samples card exposes one preview control and names every action', () => {
  it('thumbnail button is a pointer-only shortcut — out of the tab order and the accessibility tree', () => {
    const tag = openingTag(card(), /<Thumb resume=/)
    expect(tag).toMatch(/\btabIndex=\{-1\}/)
    expect(tag).toMatch(/\baria-hidden\b/)
    expect(card()).not.toContain('<span className="sr-only">Preview {e.role} sample</span>')
  })

  it('thumbnail click hands focus to the title button before opening, so Escape returns focus to a visible control', () => {
    const tag = openingTag(card(), /<Thumb resume=/)
    expect(tag).toContain("querySelector<HTMLButtonElement>('button[data-sample-title]')")
    expect(tag).toMatch(/\.focus\(\)\s*setPreviewExample\(e\)/)
  })

  it('title button says what it does and keeps its visible text in the name (Label in Name)', () => {
    const tag = openingTag(card(), /\{e\.role\}\s*<\/button>/)
    expect(tag).toContain('data-sample-title')
    expect(tag).toContain('aria-label={`Preview ${e.role} sample`}')
  })

  it('"Use this example" links are told apart by role, visible text first', () => {
    const tag = openingTag(card(), /Use this example/)
    expect(tag).toContain('aria-label={`Use this example: ${e.role}`}')
    const dialogLink = src.match(
      /<Link\s+to=\{`\/builder\?example=\$\{previewExample\.slug\}`\}\s+aria-label=\{`Use this example: \$\{previewExample\.role\}`\}/,
    )
    expect(dialogLink).not.toBeNull()
  })

  it('leaves exactly three focusable controls per card: save star, title, Use link', () => {
    const focusable = openingTags(card()).filter((t) => !/\btabIndex=\{-1\}/.test(t.tag))
    expect(focusable.map((t) => t.name)).toEqual(['button', 'button', 'Link'])
  })
})
