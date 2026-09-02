import type React from 'react'
import { wrapLink, wrapSelection } from '@/lib/marks'

type MarkField = HTMLTextAreaElement | HTMLInputElement

/** Apply a bold/italic/underline/link mark toggle to the current selection, firing React's onChange. */
function applyMark(el: MarkField, mark: '**' | '*' | '__' | 'link') {
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const next =
    mark === 'link' ? wrapLink(el.value, start, end) : wrapSelection(el.value, start, end, mark)
  if (!next) return
  const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  setter?.call(el, next.value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.setSelectionRange(next.start, next.end)
}

/** Ctrl/Cmd+B/I/U/K mark shortcuts for any textarea or text input; returns true when handled. */
export function markShortcutKeyDown(ev: React.KeyboardEvent<MarkField>): boolean {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return false
  const key = ev.key.toLowerCase()
  if (key !== 'b' && key !== 'i' && key !== 'u' && key !== 'k') return false
  ev.preventDefault()
  applyMark(ev.currentTarget, key === 'b' ? '**' : key === 'i' ? '*' : key === 'u' ? '__' : 'link')
  return true
}
