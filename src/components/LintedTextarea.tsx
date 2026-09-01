import { useMemo, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { checkBullet, type BulletIssue } from '@/lib/guidance'
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

/** Issue kinds that point at the wording of a specific line, worth underlining in place. */
const UNDERLINED_KINDS: ReadonlySet<BulletIssue['kind']> = new Set([
  'weak-opener',
  'first-person',
  'filler',
  'buzzword',
  'passive',
  'too-long',
])

/**
 * Textarea with a Grammarly-style wavy underline on lines that trip the
 * bullet-quality checks. The underline is drawn by a pointer-transparent
 * backdrop that mirrors the textarea's metrics; the real messages live in
 * BulletGuidance below the field.
 */
export function LintedTextarea({
  value,
  ...props
}: React.ComponentProps<'textarea'> & { value: string }) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const lines = useMemo(() => value.split('\n'), [value])
  const flagged = useMemo(
    () => lines.map((l) => checkBullet(l).some((i) => UNDERLINED_KINDS.has(i.kind))),
    [lines]
  )
  return (
    <div className="relative w-full">
      <Textarea
        value={value}
        onScroll={(ev) => {
          if (backdropRef.current) backdropRef.current.scrollTop = ev.currentTarget.scrollTop
        }}
        {...props}
        onKeyDown={(ev) => {
          if ((ev.ctrlKey || ev.metaKey) && !ev.altKey) {
            const key = ev.key.toLowerCase()
            if (key === 'b' || key === 'i' || key === 'u' || key === 'k') {
              ev.preventDefault()
              applyMark(
                ev.currentTarget,
                key === 'b' ? '**' : key === 'i' ? '*' : key === 'u' ? '__' : 'link'
              )
              return
            }
          }
          props.onKeyDown?.(ev)
        }}
      />
      <div
        ref={backdropRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-transparent px-3 py-2 text-sm whitespace-pre-wrap [overflow-wrap:break-word] text-transparent"
      >
        {lines.map((l, i) => (
          <span
            key={i}
            className={
              flagged[i] ? 'underline decoration-amber-500 decoration-wavy underline-offset-4' : undefined
            }
          >
            {i < lines.length - 1 ? l + '\n' : l}
          </span>
        ))}
      </div>
    </div>
  )
}
