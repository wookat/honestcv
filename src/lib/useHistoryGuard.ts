import { useEffect } from 'react'

const GUARD_KEY = 'hcv-history-guard'

function onGuardEntry(): boolean {
  const state = window.history.state as Record<string, unknown> | null
  return Boolean(state && state[GUARD_KEY])
}

/**
 * While `active`, browser Back/Forward pops a sentinel history entry instead
 * of leaving the page, and `onBlocked` opens the surface's own confirmation
 * UI. Same-document (SPA) navigations never fire `beforeunload`, so this is
 * the only way to guard unsaved work against the Back button.
 */
export function useHistoryGuard(active: boolean, onBlocked: () => void) {
  useEffect(() => {
    if (!active) return
    window.history.pushState({ [GUARD_KEY]: true }, '')
    const onPop = () => {
      window.history.pushState({ [GUARD_KEY]: true }, '')
      onBlocked()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (onGuardEntry()) window.history.back()
    }
  }, [active, onBlocked])
}
