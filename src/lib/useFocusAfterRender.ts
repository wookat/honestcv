import { useEffect, useRef } from 'react'

/**
 * Keyboard focus for actions whose button unmounts as a result of the action
 * (e.g. swapping which copy a job links to re-renders the rows). Call the
 * returned function with the id of the element that should hold focus once
 * the next render has committed.
 */
export function useFocusAfterRender(): (id: string) => void {
  const pending = useRef<string | null>(null)
  useEffect(() => {
    if (pending.current === null) return
    const el = document.getElementById(pending.current)
    pending.current = null
    if (el instanceof HTMLElement) el.focus()
  })
  return (id: string) => {
    pending.current = id
  }
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
