import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Inline text button inside a sentence: 40px-tall hit area on touch widths without changing the line box. */
export const INLINE_ACTION = 'relative -my-3 inline-flex items-center py-3 sm:my-0 sm:py-0'
/** Same for an inline link whose text may wrap: padding on an inline box grows the hit area, not the line. */
export const INLINE_LINK = 'relative py-3 sm:py-0'
