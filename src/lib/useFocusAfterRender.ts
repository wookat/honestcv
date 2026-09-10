import { useEffect, useMemo, useRef } from 'react'

/**
 * Keyboard focus for actions whose button unmounts as a result of the action
 * (e.g. swapping which copy a job links to re-renders the rows). Call the
 * returned function with the ids of the elements that should hold focus once
 * the next render has committed; the first one present and focusable wins.
 *
 * `onlyIfLost`: skip when something else already took focus by then (e.g. a
 * dialog the action opened), and only rescue focus that fell to `<body>`.
 */
export function useFocusAfterRender(opts?: { onlyIfLost?: boolean }): (...ids: string[]) => void {
  const pending = useRef<readonly string[]>([])
  const onlyIfLost = opts?.onlyIfLost ?? false
  useEffect(() => {
    if (pending.current.length === 0) return
    const ids = pending.current
    pending.current = []
    if (onlyIfLost && document.activeElement && document.activeElement !== document.body) return
    for (const id of ids) {
      const el = document.getElementById(id)
      if (!(el instanceof HTMLElement)) continue
      el.focus()
      if (document.activeElement === el) return
    }
  })
  return (...ids: string[]) => {
    pending.current = ids
  }
}

/**
 * Where focus should land once the rows with `removedIds` are gone: the
 * control of the next remaining row matching `selector` in document order,
 * else the previous one, else the page's `main` landmark. Call it while the
 * rows are still in the DOM (i.e. when the removal is confirmed).
 */
export function neighbourFocusId(removedIds: readonly string[], selector: string): string {
  const removed = new Set(removedIds)
  const all = [...document.querySelectorAll<HTMLElement>(selector)]
  const first = all.findIndex((el) => removed.has(el.id))
  if (first < 0) return 'main'
  const after = all.slice(first + 1).find((el) => !removed.has(el.id))
  const before = all.slice(0, first).reverse().find((el) => !removed.has(el.id))
  return (after ?? before)?.id ?? 'main'
}

/**
 * What a closing confirm dialog does with focus once its close animation ends:
 * `keep` it where it already is when something outside the dialog holds it
 * (the action's Undo toast, or wherever the user has since tabbed), else
 * `target` the element this dialog's confirmed action produced when it exists,
 * else `restore` the opener (the library default: Cancel / Escape, including
 * while an earlier action's Undo toast is still showing).
 */
export function closeFocusPlan(input: {
  activeOutsideDialog: boolean
  targetPresent: boolean
  confirmed: boolean
}): 'keep' | 'target' | 'restore' {
  if (input.activeOutsideDialog) return 'keep'
  return input.confirmed && input.targetPresent ? 'target' : 'restore'
}

/**
 * `onCloseAutoFocus` for a confirm dialog whose action removes its opener:
 * once the dialog closes after a `confirmed` action, focus the element with
 * `id` (e.g. the Undo toast the action produced) instead of letting focus fall
 * to `<body>`. Leaves the default restore alone otherwise (Cancel path, or the
 * element is absent). The dialog stays mounted for its close animation, so
 * focus that already sits outside it by then is left alone.
 */
export const focusOnClose = (id: string, confirmed: boolean) => (event: Event) => {
  const el = document.getElementById(id)
  const active = document.activeElement
  const dialog = event.currentTarget
  const plan = closeFocusPlan({
    activeOutsideDialog:
      active instanceof HTMLElement &&
      active !== document.body &&
      !(dialog instanceof Node && dialog.contains(active)),
    targetPresent: el instanceof HTMLElement,
    confirmed,
  })
  if (plan === 'restore') return
  event.preventDefault()
  if (plan === 'target' && el instanceof HTMLElement) el.focus()
}

/**
 * `focusOnClose` for one confirm dialog: spread `onCloseAutoFocus` onto its
 * `DialogContent` and call `confirm()` where the action produces the `id`
 * element. A close without `confirm()` (Cancel, Escape, overlay) restores the
 * opener even while an earlier action's `id` element is still on the page.
 */
export function useConfirmClose(id: string): {
  confirm: () => void
  onCloseAutoFocus: (event: Event) => void
} {
  const confirmed = useRef(false)
  return useMemo(
    () => ({
      confirm: () => {
        confirmed.current = true
      },
      onCloseAutoFocus: (event: Event) => {
        const did = confirmed.current
        confirmed.current = false
        focusOnClose(id, did)(event)
      },
    }),
    [id]
  )
}
