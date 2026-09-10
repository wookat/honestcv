import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { closingChildren } from '../src/lib/closingChildren'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
const dialogSrc = read('../src/components/ui/dialog.tsx')

// Production 375×812 (R857 bundle `Jobs-Cn_nszOk.js`), rAF + MutationObserver log on the
// dialog after the confirm click, every frame until the node detached:
//   bulk   "Stop tracking 2 jobs?"  → "Stop tracking 0 jobs?"  from the first closed frame
//          (opacity 1.00, data-state=closed) until unmount; 3 of 6 mounted frames wrong
//   single 'Stop tracking "Senior AI Engineer – Notebooks"?' → 'Stop tracking ""?', and the
//          description read "…deletes . Targeted resume copies…"; 2 of 5 mounted frames wrong
// The confirm handler untracks and clears the selection / `confirmUntrack` in the same click
// that closes the dialog; Radix keeps the content mounted for the ~200 ms close animation.
// Dashboard's Delete "<name>"? / Delete N copies? / Remove folder "<f>"? and the Builder
// copy-delete dialog read their state the same way.
describe('R858: a closing dialog keeps showing what it showed while open', () => {
  it('renders the current children while open (or uncontrolled), the last open ones while closing', () => {
    expect(closingChildren(true, 'now', 'before')).toBe('now')
    expect(closingChildren(undefined, 'now', 'before')).toBe('now')
    expect(closingChildren(false, 'now', 'before')).toBe('before')
  })

  it('Dialog shares its `open` with DialogContent through context', () => {
    expect(dialogSrc).toMatch(/const DialogOpenContext = React\.createContext<boolean \| undefined>\(undefined\)/)
    expect(dialogSrc).toMatch(/<DialogOpenContext\.Provider value=\{open\}>\s*<DialogPrimitive\.Root data-slot="dialog" open=\{open\} \{\.\.\.props\} \/>/)
  })

  it('DialogContent snapshots its children on every open render and renders the snapshot while closing', () => {
    const content = dialogSrc.slice(dialogSrc.indexOf('function DialogContent('))
    expect(content).toContain('const open = React.useContext(DialogOpenContext)')
    expect(content).toContain('const [lastOpen, setLastOpen] = React.useState<React.ReactNode>(children)')
    expect(content).toContain('if (open !== false && lastOpen !== children) setLastOpen(children)')
    expect(content).toContain('const shown = closingChildren(open, children, lastOpen)')
    expect(content).toMatch(/>\s*\{shown\}\s*<DialogPrimitive\.Close/)
    expect(content).not.toMatch(/>\s*\{children\}\s*<DialogPrimitive\.Close/)
  })
})
