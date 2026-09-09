import { useEffect, useId, useReducer, useRef } from 'react'
import {
  AUDIT_CHIP_IDLE,
  AUDIT_EXPLANATION,
  type AuditFinding,
  auditChipReducer,
  auditChipVisible,
} from '@/lib/auditChip'
import { cn } from '@/lib/utils'

/** Per-entry audit badge (✓ / ⚠ n) whose findings panel opens on hover, focus or a
 * click / tap and closes on Escape, a second click or a click outside. */
export function EntryAuditChip({
  findings,
  filled,
  checks,
  expandable,
  onExpand,
  label,
}: {
  findings: AuditFinding[]
  filled: boolean
  /** Ordered audit category names that apply to this section type. */
  checks: string[]
  /** Whether the card is collapsed, so the warning chip can expand it. */
  expandable: boolean
  onExpand: () => void
  label: string
}) {
  const groups = new Map<string, number[]>()
  for (const f of findings) {
    const lines = groups.get(f.category) ?? []
    if (f.line !== undefined) lines.push(f.line)
    groups.set(f.category, lines)
  }
  const passedNames = checks.filter((c) => !groups.has(c))
  const passed = passedNames.length
  const [state, dispatch] = useReducer(auditChipReducer, AUDIT_CHIP_IDLE)
  const visible = auditChipVisible(state)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const panelId = useId()
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch('escape')
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) dispatch('outside')
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [visible])
  if (findings.length === 0 && !filled) return null
  const ok = findings.length === 0
  const name = ok
    ? `${label}: ${checks.length} best practice${checks.length === 1 ? '' : 's'} applied`
    : `${label}: ${findings.length} suggestion${findings.length === 1 ? '' : 's'}${
        expandable ? ' — expand to review' : ''
      }`
  return (
    <span
      ref={wrapRef}
      className="relative flex shrink-0"
      onMouseEnter={() => dispatch('enter')}
      onMouseLeave={() => dispatch('leave')}
      onFocus={() => dispatch('focus')}
      onBlur={() => dispatch('blur')}
    >
      <button
        type="button"
        className="flex min-h-10 min-w-10 items-center justify-center rounded sm:min-h-0 sm:min-w-0"
        aria-label={name}
        aria-expanded={visible}
        aria-controls={panelId}
        onPointerDown={expandable ? onExpand : undefined}
        onClick={(e) => {
          if (!expandable) dispatch('toggle')
          else if (e.detail === 0) onExpand()
        }}
      >
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-semibold',
            ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
            expandable && 'transition hover:bg-amber-100',
          )}
        >
          {ok ? '✓' : `⚠ ${findings.length}`}
        </span>
      </button>
      <div
        id={panelId}
        className={cn(
          'bg-popover text-popover-foreground fixed inset-x-4 bottom-20 z-40 rounded-md border p-2 text-left shadow-md sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:mt-1 sm:w-64',
          visible ? 'block' : 'hidden',
        )}
      >
        <ul className="space-y-1 text-[11px] leading-snug font-normal">
          {[...groups.entries()].map(([category, lines]) => (
            <li key={category} className="text-amber-700">
              ⚠ {category}
              {lines.length > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  — line{lines.length === 1 ? '' : 's'} {[...new Set(lines)].join(', ')}
                </span>
              )}
              {AUDIT_EXPLANATION[category] && (
                <span className="text-muted-foreground block">{AUDIT_EXPLANATION[category]}</span>
              )}
            </li>
          ))}
          {passed > 0 && (
            <li className="text-emerald-700">
              ✓ {passed} best practice{passed === 1 ? '' : 's'} applied
              <span className="text-muted-foreground block">{passedNames.join(', ')}</span>
            </li>
          )}
        </ul>
      </div>
    </span>
  )
}
