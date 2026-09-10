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

/**
 * Key handler for a one-paragraph prose textarea (summary, certification description,
 * education details): Enter never inserts a line break; mark shortcuts still apply.
 */
export function proseKeyDown(ev: React.KeyboardEvent<MarkField>): void {
  if (ev.key === 'Enter') ev.preventDefault()
  markShortcutKeyDown(ev)
}

/** Value of a one-paragraph prose textarea: pasted or dropped line breaks become spaces. */
export const proseInput = (value: string): string => value.replace(/\r?\n/g, ' ')

/** Ctrl/Cmd+B/I/U/K mark shortcuts for any textarea or text input; returns true when handled. */
export function markShortcutKeyDown(ev: React.KeyboardEvent<MarkField>): boolean {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return false
  const key = ev.key.toLowerCase()
  if (key !== 'b' && key !== 'i' && key !== 'u' && key !== 'k') return false
  ev.preventDefault()
  applyMark(ev.currentTarget, key === 'b' ? '**' : key === 'i' ? '*' : key === 'u' ? '__' : 'link')
  return true
}
