import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = (rel: string) => readFileSync(path.resolve(import.meta.dirname, '..', rel), 'utf8')
const builderSrc = src('src/pages/Builder.tsx')
const dashboardSrc = src('src/pages/Dashboard.tsx')
const dialogSrc = src('src/components/ui/dialog.tsx')

/** The `<Button …>` opening tag (up to the label) whose JSX body contains `label`. */
const buttonTagFor = (source: string, label: string): string => {
  const at = source.indexOf(label)
  expect(at, label).toBeGreaterThan(-1)
  const open = source.lastIndexOf('<Button', at)
  return source.slice(open, at)
}

/**
 * R824: at 375px the Import dialog's grid column took its min-content width
 * from the nowrap "Import — replaces current content (Ctrl+Z to undo)" button
 * (397px), so the heading, description, form and textarea all ran 47px past the
 * dialog's right edge. The dialog column must be allowed to shrink and long
 * dialog action labels must wrap.
 */
describe('R824: dialog content shrinks to the viewport on small screens', () => {
  it('DialogContent lays its children out in a column that can shrink below min-content', () => {
    const at = dialogSrc.indexOf('data-slot="dialog-content"')
    expect(at).toBeGreaterThan(-1)
    const tag = dialogSrc.slice(at, dialogSrc.indexOf('{...props}', at))
    expect(tag).toMatch(/\bgrid\b/)
    expect(tag).toContain('grid-cols-[minmax(0,1fr)]')
    expect(tag).toContain('max-w-[calc(100%-2rem)]')
  })

  it('the Import dialog action wraps instead of forcing a 397px column', () => {
    const tag = buttonTagFor(builderSrc, 'Import — replaces current content (Ctrl+Z to undo)')
    expect(tag).toContain('whitespace-normal')
    expect(tag).toContain('h-auto')
  })

  it('the setup wizard option cards wrap their two-line labels', () => {
    for (const label of [
      'PDF, DOCX or pasted text — parsed entirely in your browser',
      'Build section by section with the Getting started checklist',
    ]) {
      const tag = buttonTagFor(builderSrc, label)
      expect(tag, label).toContain('whitespace-normal')
      expect(tag, label).toContain('w-full')
    }
  })

  it('the Resume settings save actions with long labels wrap on touch widths', () => {
    for (const label of [
      'Save as new copy and use it for that job instead',
      'Save and use this copy for that job instead',
    ]) {
      const tag = buttonTagFor(dashboardSrc, label)
      expect(tag, label).toContain('whitespace-normal')
      expect(tag, label).toContain('h-auto')
    }
  })
})
