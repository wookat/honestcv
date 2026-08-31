/** Local-first template picker preferences: favorites and recently used. */

const FAV_KEY = 'honestcv.templateFavorites'
const RECENT_KEY = 'honestcv.templateRecents'
const RECENT_CAP = 6

function loadIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

function saveIds(key: string, ids: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    /* storage unavailable — favorites/recents just don't persist */
  }
}

/** Favorited template ids (insertion order). */
export function loadTemplateFavorites(): string[] {
  return loadIds(FAV_KEY)
}

/** Toggle a template id in favorites; persists and returns the next list. */
export function toggleTemplateFavorite(id: string): string[] {
  const prev = loadTemplateFavorites()
  const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  saveIds(FAV_KEY, next)
  return next
}

/** Recently picked template ids, most recent first. */
export function loadTemplateRecents(): string[] {
  return loadIds(RECENT_KEY)
}

/** Record an explicit template pick; dedupes to front, caps the list. */
export function recordTemplateRecent(id: string): string[] {
  const next = [id, ...loadTemplateRecents().filter((x) => x !== id)].slice(0, RECENT_CAP)
  saveIds(RECENT_KEY, next)
  return next
}
