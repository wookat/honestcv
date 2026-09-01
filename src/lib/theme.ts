/**
 * Device-local color scheme preference (light / dark / follow the OS).
 * Stored per browser, not on the resume — a display preference, not data.
 */

export type ThemePref = 'light' | 'dark' | 'system'

const KEY = 'honestcv.theme'

export function loadThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function saveThemePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    /* storage unavailable */
  }
  applyThemePref(pref)
}

export function applyThemePref(pref: ThemePref) {
  const dark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Keep a `system` preference in sync with live OS scheme changes. */
export function watchSystemTheme(): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (loadThemePref() === 'system') applyThemePref('system')
  }
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
