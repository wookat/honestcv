import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const builderSrc = readFileSync(
  path.resolve(import.meta.dirname, '../src/pages/Builder.tsx'),
  'utf8',
)

// The "one bullet per line" description boxes of involvement / coursework / award /
// publication / military / certification / agent entries shared their row with a
// four-to-five-button toolbar, which left them 161 px usable at 1024 (Military
// 207 px) and 289 px at 1280 — a median real bullet (102 chars, 678 px at 14px
// Inter) needed 5 lines in a 2-row box at 1024 and 3 at 1280, and the Military
// placeholder itself needed 3 lines. Experience bullets and (since R837) the
// education details box already take the full card width, so these boxes do too:
// textarea on its own line, toolbar right-aligned beneath (ENTRY_TEXT_STACK).
describe('R838: entry description textareas take the full card width', () => {
  const DESCRIPTIONS = [
    'id={`inv-${inv.id}-description`}',
    'id={`cw-${cw.id}-description`}',
    'id={`award-${a.id}-description`}',
    'id={`pub-${pub.id}-description`}',
    'id={`mil-${m.id}-description`}',
    'id={`cert-${c.id}-description`}',
    'aria-label="How building the agent was relevant"',
  ]

  it.each(DESCRIPTIONS)('%s sits in ENTRY_TEXT_STACK, not the shared ENTRY_TEXT_ROW', (marker) => {
    const at = builderSrc.indexOf(marker)
    expect(at).toBeGreaterThan(-1)
    const rowOpen = builderSrc.lastIndexOf('<div className={ENTRY_TEXT_', at)
    expect(builderSrc.slice(rowOpen, builderSrc.indexOf('>', rowOpen) + 1)).toBe(
      '<div className={ENTRY_TEXT_STACK}>',
    )
    const tagOpen = builderSrc.lastIndexOf('<', at)
    expect(builderSrc.slice(tagOpen, builderSrc.indexOf('/>', at))).toContain('rows={2}')
  })

  it('keeps the toolbar in the same row container, right-aligned beneath the textarea', () => {
    const stack = builderSrc.match(/const ENTRY_TEXT_STACK =\s*'([^']+)'/)?.[1] ?? ''
    expect(stack).toContain('flex-wrap')
    expect(stack).toContain('[&>:first-child]:basis-full')
    expect(stack).toContain('[&>:nth-child(2)]:ml-auto')
    expect(stack).not.toMatch(/\bsm:/)
  })

  it('the shared row survives only where a single button follows the box (project description)', () => {
    const uses = builderSrc.match(/<div className=\{ENTRY_TEXT_ROW\}>/g) ?? []
    expect(uses).toHaveLength(1)
    const at = builderSrc.indexOf('<div className={ENTRY_TEXT_ROW}>')
    const row = builderSrc.slice(at, builderSrc.indexOf('<BulletGuidance', at))
    expect(row).toContain('aria-label="Project description"')
    expect(row.match(/<Button\b/g) ?? []).toHaveLength(1)
  })
})
