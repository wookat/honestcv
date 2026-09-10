import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { closeFocusPlan } from '../src/lib/useFocusAfterRender'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
const focusSrc = read('../src/lib/useFocusAfterRender.ts')

// Production 1280×800 (R855 bundle), focusin / keydown / dialog-state log after confirming
// "Stop tracking" (single via the Saved chip, bulk via Untrack 2 — identical):
//   +20 ms  focusin Undo            (the action's focusAfterRender)
//   +22 ms  dialog data-state=closed (still mounted for its close animation)
//   +86 ms  Tab → focusin Dismiss   (the user moves on)
//   +232 ms dialog detached → onCloseAutoFocus → focusin Undo   ← focus yanked back
//   Enter → Undo fires, rows restored (the user pressed Enter on Dismiss)
// Tab after the dialog detached (+663 ms) stayed on Dismiss and Enter dismissed.
describe('R856: a closing confirm dialog leaves focus where it already is', () => {
  it('keeps focus that sits outside the dialog (Undo toast, or wherever the user tabbed to)', () => {
    expect(closeFocusPlan({ activeOutsideDialog: true, targetPresent: true })).toBe('keep')
    expect(closeFocusPlan({ activeOutsideDialog: true, targetPresent: false })).toBe('keep')
  })

  it('still hands focus to the Undo toast when focus fell to body, and restores the opener without one', () => {
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: true })).toBe('target')
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: false })).toBe('restore')
  })

  it('focusOnClose decides from the live active element and the closing dialog node', () => {
    const fn = focusSrc.slice(focusSrc.indexOf('export const focusOnClose'))
    expect(fn).toContain('const active = document.activeElement')
    expect(fn).toContain('const dialog = event.currentTarget')
    expect(fn).toMatch(/active !== document\.body &&\s*!\(dialog instanceof Node && dialog\.contains\(active\)\)/)
    expect(fn).toContain("if (plan === 'restore') return")
    expect(fn).toContain('event.preventDefault()')
    expect(fn).toMatch(/if \(plan === 'target' && el instanceof HTMLElement\) el\.focus\(\)/)
  })
})
