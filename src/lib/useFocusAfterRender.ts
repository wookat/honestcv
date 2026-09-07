import { useEffect, useRef } from 'react'

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
 * `onCloseAutoFocus` for a confirm dialog whose action removes its opener:
 * once the dialog closes, focus the element with `id` (e.g. the Undo toast
 * the action produced) instead of letting focus fall to `<body>`. Leaves the
 * default restore alone when the element is absent (Cancel path).
 */
export const focusOnClose = (id: string) => (event: Event) => {
  const el = document.getElementById(id)
  if (!(el instanceof HTMLElement)) return
  event.preventDefault()
  el.focus()
}
