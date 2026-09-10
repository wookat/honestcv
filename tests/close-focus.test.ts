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
    expect(closeFocusPlan({ activeOutsideDialog: true, targetPresent: true, confirmed: true })).toBe('keep')
    expect(closeFocusPlan({ activeOutsideDialog: true, targetPresent: false, confirmed: false })).toBe('keep')
  })

  it('still hands focus to the Undo toast when focus fell to body, and restores the opener without one', () => {
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: true, confirmed: true })).toBe('target')
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: false, confirmed: true })).toBe('restore')
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

// Production 375×812 / 1280×800 (R859 bundle): untrack job A (Undo toast shows), open "Stop tracking"
// on job B, Cancel (button or Escape) → focus landed on A's Undo, not B's Saved chip, and the toast
// — paused while focused — was still there 11 s later. Same on the Builder copies dialog
// (Delete copy A → Delete copy B → Cancel → focus on Undo). Without a stale toast, Cancel restored
// the opener. The Dashboard delete dialogs share the helper.
describe('R860: Cancel restores the opener even while an earlier action\'s Undo toast is showing', () => {
  it('only a confirmed action hands focus to the Undo element; a plain close restores the opener', () => {
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: true, confirmed: false })).toBe('restore')
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: false, confirmed: false })).toBe('restore')
    expect(closeFocusPlan({ activeOutsideDialog: false, targetPresent: true, confirmed: true })).toBe('target')
  })

  it('useConfirmClose arms once per confirmed action and disarms on every close', () => {
    const hook = focusSrc.slice(focusSrc.indexOf('export function useConfirmClose'))
    expect(hook).toContain('confirmed.current = true')
    expect(hook).toMatch(/const did = confirmed\.current\s*confirmed\.current = false\s*focusOnClose\(id, did\)\(event\)/)
  })

  it('every confirm dialog with an Undo toast uses the hook and confirms where the toast is produced', () => {
    const pages = {
      Builder: { src: read('../src/pages/Builder.tsx'), undo: 'undo-copy', dialogs: 1 },
      Dashboard: { src: read('../src/pages/Dashboard.tsx'), undo: 'undo-delete', dialogs: 3 },
      Jobs: { src: read('../src/pages/Jobs.tsx'), undo: 'undo-untrack', dialogs: 2 },
    }
    for (const [name, p] of Object.entries(pages)) {
      expect(p.src, name).not.toContain('focusOnClose(')
      expect(p.src.match(new RegExp(`useConfirmClose\\('${p.undo}'\\)`, 'g'))?.length, name).toBe(p.dialogs)
      expect(p.src.match(/onCloseAutoFocus=\{\w+Close\.onCloseAutoFocus\}/g)?.length, name).toBe(p.dialogs)
      expect(p.src.match(/\w+Close\.confirm\(\)/g)?.length, name).toBe(p.dialogs)
    }
    // Builder / Dashboard: confirm() sits right before the Undo state is produced.
    expect(pages.Builder.src.match(/deleteCopyClose\.confirm\(\)\s*setUndoDeleteCopy\(\{/g)?.length).toBe(1)
    expect(pages.Dashboard.src.match(/\w+Close\.confirm\(\)\s*setUndoDelete\(\{/g)?.length).toBe(3)
    // Jobs: confirm() only after untrack() produced the toast (it returns false on a storage failure).
    expect(pages.Jobs.src.match(/if \(confirmUntrack && !untrack\(\[confirmUntrack\.id\]\)\) return\s*untrackClose\.confirm\(\)/g)?.length).toBe(1)
    expect(pages.Jobs.src.match(/if \(!untrack\(\[\.\.\.visibleBulkIds\]\)\) return\s*bulkUntrackClose\.confirm\(\)/g)?.length).toBe(1)
  })
})
