import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { popoverShift } from '@/lib/popoverShift'
import { DATE_WORDS, type ResumeLanguage } from '@/lib/resume'

function yearOf(value: string): number {
  const m = /\b(19|20)\d{2}\b/.exec(value)
  return m ? Number(m[0]) : new Date().getFullYear()
}

/**
 * Free-text date input with a month + year picker popover.
 * Values stay plain strings ("Jun 2023", "Present" — month and ongoing words in the
 * resume's language), typing always works.
 */
export function MonthYearField({
  value,
  onChange,
  placeholder,
  allowPresent = false,
  language = 'en',
  id,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowPresent?: boolean
  language?: ResumeLanguage
  id?: string
  ariaLabel?: string
}) {
  const { months, present } = DATE_WORDS[language]
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => yearOf(value))
  const [shift, setShift] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const pop = popoverRef.current
      const anchor = ref.current
      if (!pop || !anchor) return
      // The popover is right-aligned to the field; measure its untransformed rect from the anchor.
      const right = anchor.getBoundingClientRect().right
      setShift(
        popoverShift(
          { left: right - pop.offsetWidth, right },
          document.documentElement.clientWidth,
        ),
      )
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (!open) return
    popoverRef.current?.scrollIntoView({ block: 'nearest' })
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (text: string) => {
    onChange(text)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Input
        id={id}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10 sm:pr-8"
      />
      <button
        type="button"
        aria-label={open ? 'Close date picker' : 'Open date picker'}
        aria-expanded={open}
        className="text-muted-foreground hover:text-foreground absolute -inset-y-0.5 right-0 flex w-10 items-center justify-center sm:inset-y-0 sm:w-8"
        onClick={() => {
          if (!open) setYear(yearOf(value))
          setOpen((o) => !o)
        }}
      >
        <Calendar aria-hidden className="size-4" />
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="bg-background absolute right-0 top-full z-30 mt-1 w-56 rounded-md border p-2 shadow-lg"
          style={shift ? { transform: `translateX(${shift}px)` } : undefined}
        >
          <div className="flex items-center justify-between px-1 pb-1.5">
            <button
              type="button"
              aria-label="Previous year"
              className="hover:bg-accent flex size-8 items-center justify-center rounded-sm text-sm"
              onClick={() => setYear((y) => y - 1)}
            >
              ‹
            </button>
            <span className="text-sm font-medium">{year}</span>
            <button
              type="button"
              aria-label="Next year"
              className="hover:bg-accent flex size-8 items-center justify-center rounded-sm text-sm"
              onClick={() => setYear((y) => y + 1)}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((m) => (
              <button
                key={m}
                type="button"
                className="hover:bg-accent min-h-9 rounded-sm text-xs"
                onClick={() => pick(`${m} ${year}`)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1 border-t pt-1">
            <button
              type="button"
              className="hover:bg-accent min-h-9 rounded-sm text-xs"
              onClick={() => pick(String(year))}
            >
              {year} only
            </button>
            {allowPresent ? (
              <button
                type="button"
                className="hover:bg-accent min-h-9 rounded-sm text-xs font-medium"
                onClick={() => pick(present)}
              >
                {present}
              </button>
            ) : (
              <button
                type="button"
                className="text-muted-foreground hover:bg-accent min-h-9 rounded-sm text-xs"
                onClick={() => pick('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
