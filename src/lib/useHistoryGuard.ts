import { useEffect } from 'react'

const GUARD_KEY = 'hcv-history-guard'

function onGuardEntry(): boolean {
  const state = window.history.state as Record<string, unknown> | null
  return Boolean(state && state[GUARD_KEY])
}

function isGuardedLinkClick(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0) return false
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  const target = e.target as Element | null
  const anchor = target?.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false
  if (anchor.origin !== window.location.origin) return false
  return (
    anchor.pathname !== window.location.pathname ||
    anchor.search !== window.location.search
  )
}

/**
 * While `active`, same-document navigations open the surface's own
 * confirmation UI (via `onBlocked`) instead of leaving the page:
 * browser Back/Forward pops a sentinel history entry that is pushed
 * right back, and clicks on same-origin SPA links are intercepted.
 * Neither path fires `beforeunload`, so this is the only guard for
 * unsaved work against in-app navigation.
 */
export function useHistoryGuard(active: boolean, onBlocked: () => void) {
  useEffect(() => {
    if (!active) return
    window.history.pushState({ [GUARD_KEY]: true }, '')
    const onPop = () => {
      window.history.pushState({ [GUARD_KEY]: true }, '')
      onBlocked()
    }
    const onClick = (e: MouseEvent) => {
      if (!isGuardedLinkClick(e)) return
      e.preventDefault()
      e.stopPropagation()
      onBlocked()
    }
    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick, true)
      if (onGuardEntry()) window.history.back()
    }
  }, [active, onBlocked])
}
