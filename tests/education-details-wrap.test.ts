import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

// Education "details" is a sentence, not a name: every one of the 12 distinct
// values in the retained import corpus (50–345 chars, 347–2259 px at 14px Inter)
// was wider than the single-line box at 1024 / 1280 / 375 (161 / 289 / 242 px
// usable), and even the widest possible single-line row (519 px at 1280) would
// fit only 2 of them. The box therefore wraps: a two-row textarea that takes the
// full card width, with the entry toolbar on its own line beneath it.
describe('R837: education details wraps instead of clipping', () => {
  const at = builderSrc.indexOf('id={`edu-${e.id}-details`}')
  const open = builderSrc.lastIndexOf('<', at)
  const close = builderSrc.indexOf('/>', at)
  const tag = builderSrc.slice(open, close + 2)

  it('is a two-row Textarea, not an Input', () => {
    expect(at).toBeGreaterThan(-1)
    expect(tag.startsWith('<Textarea')).toBe(true)
    expect(tag).toContain('rows={2}')
  })

  it('takes the full card width with the toolbar below (ENTRY_TEXT_STACK), at every size', () => {
    const rowOpen = builderSrc.lastIndexOf('<div className=', open)
    expect(builderSrc.slice(rowOpen, builderSrc.indexOf('>', rowOpen) + 1)).toBe(
      '<div className={ENTRY_TEXT_STACK}>',
    )
    const stack = builderSrc.match(/const ENTRY_TEXT_STACK =\s*'([^']+)'/)?.[1] ?? ''
    expect(stack).toContain('[&>:first-child]:basis-full')
    expect(stack).toContain('[&>:nth-child(2)]:ml-auto')
    expect(stack).not.toMatch(/\bsm:/)
  })

  it('stays a one-line value: Enter is swallowed and pasted line breaks become spaces', () => {
    expect(tag).toContain('onKeyDown={proseKeyDown}')
    expect(tag).toContain('details: proseInput(ev.target.value)')
  })

  it('keeps its visible label and placeholder', () => {
    expect(builderSrc).toContain('<Label htmlFor={`edu-${e.id}-details`}>')
    expect(tag).toContain('placeholder="Dean\'s List, thesis title…"')
  })
})
