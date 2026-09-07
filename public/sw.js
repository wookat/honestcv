/*
 * Offline app shell for RezUp. Runtime caching only — no precache manifest:
 * hashed build assets are immutable so cache-first is always correct, and
 * navigations stay network-first so online users always get fresh HTML.
 * /api/* and /s/* (no-store shared links) are never intercepted.
 */
const ASSET_CACHE = 'hcv-assets-v1'
const PAGE_CACHE = 'hcv-pages-v1'
const STATIC_CACHE = 'hcv-static-v1'
const KNOWN_CACHES = [ASSET_CACHE, PAGE_CACHE, STATIC_CACHE]
const PAGE_LIMIT = 40
const ASSET_LIMIT = 80

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i])
}

async function put(cacheName, request, response, limit) {
  if (!response || response.status !== 200) return
  const cache = await caches.open(cacheName)
  await cache.put(request, response)
  await trim(cacheName, limit)
}

async function pageNetworkFirst(request) {
  try {
    const fresh = await fetch(request)
    await put(PAGE_CACHE, request, fresh.clone(), PAGE_LIMIT)
    return fresh
  } catch {
    const cache = await caches.open(PAGE_CACHE)
    const own = await cache.match(request, { ignoreSearch: true })
    if (own) return own
    // Any cached app-shell page hydrates into the requested SPA route.
    const keys = await cache.keys()
    if (keys.length > 0) {
      const fallback = await cache.match(keys[keys.length - 1])
      if (fallback) return fallback
    }
    throw new Error('offline and no cached shell')
  }
}

async function assetCacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const hit = await cache.match(request)
  if (hit) return hit
  const fresh = await fetch(request)
  await put(ASSET_CACHE, request, fresh.clone(), ASSET_LIMIT)
  return fresh
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then(async (fresh) => {
      await put(STATIC_CACHE, request, fresh.clone(), ASSET_LIMIT)
      return fresh
    })
    .catch(() => undefined)
  if (hit) return hit
  const fresh = await refresh
  if (fresh) return fresh
  throw new Error('offline and not cached')
}

const STATIC_PATH = /\.(?:woff2|png|svg|webmanifest)$/
// Build-generated sample library data: changes only on deploy, so SWR keeps
// it available offline while refreshing in the background.
const EXAMPLES_JSON = /^\/examples\/[^/]+\.json$/

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/s/')) return
  if (request.mode === 'navigate') {
    event.respondWith(pageNetworkFirst(request))
    return
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(assetCacheFirst(request))
    return
  }
  if (STATIC_PATH.test(url.pathname) || EXAMPLES_JSON.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
