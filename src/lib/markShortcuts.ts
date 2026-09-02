import type React from 'react'
import { wrapLink, wrapSelection } from '@/lib/marks'

/** Apply a bold/italic/underline/link mark toggle to the current selection, firing React's onChange. */
function applyMark(el: HTMLTextAreaElement, mark: '**' | '*' | '__' | 'link') {
  const next =
    mark === 'link'
      ? wrapLink(el.value, el.selectionStart, el.selectionEnd)
      : wrapSelection(el.value, el.selectionStart, el.selectionEnd, mark)
  if (!next) return
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter?.call(el, next.value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.setSelectionRange(next.start, next.end)
}

/** Ctrl/Cmd+B/I/U/K mark shortcuts for any textarea; returns true when handled. */
export function markShortcutKeyDown(ev: React.KeyboardEvent<HTMLTextAreaElement>): boolean {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return false
  const key = ev.key.toLowerCase()
  if (key !== 'b' && key !== 'i' && key !== 'u' && key !== 'k') return false
  ev.preventDefault()
  applyMark(ev.currentTarget, key === 'b' ? '**' : key === 'i' ? '*' : key === 'u' ? '__' : 'link')
  return true
}
