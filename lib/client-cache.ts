// ============================================================
// lib/client-cache.ts
// Lightweight sessionStorage cache for client-side data fetches, used
// for a stale-while-revalidate pattern: show cached data instantly on
// mount (no loading spinner), then quietly refetch and update once
// fresh data arrives. sessionStorage (not localStorage) so it clears
// itself when the tab closes rather than persisting indefinitely.
//
// Every cache key used for logged-in-user data should be prefixed with
// "uc:" (user cache) so it can be wiped in one call on logout — see
// clearAllUserCache().
// ============================================================

interface CacheEntry<T> {
  value: T
  cachedAt: number
}

const PREFIX = "uc:"

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    return entry.value
  } catch {
    return null
  }
}

export function setCached<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    const entry: CacheEntry<T> = { value, cachedAt: Date.now() }
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* sessionStorage full or unavailable — fail silently, caching is
       an optimization, not a requirement */
  }
}

export function clearCached(key: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(PREFIX + key)
  } catch { /* noop */ }
}

// Wipes every cached user-data entry. Call this on logout so the next
// person to use the device/browser never sees a flash of the previous
// user's cached name, photo, or profile data.
export function clearAllUserCache(): void {
  if (typeof window === "undefined") return
  try {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIX))
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch { /* noop */ }
}

// Stale-while-revalidate: returns cached data immediately (if any) via
// onCached, then always fetches fresh data and reports it via onFresh —
// call sites use this to paint instantly from cache while quietly
// confirming/updating in the background.
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  onCached: (value: T) => void,
  onFresh: (value: T) => void
): Promise<void> {
  const cached = getCached<T>(key)
  if (cached !== null) onCached(cached)

  try {
    const fresh = await fetcher()
    setCached(key, fresh)
    onFresh(fresh)
  } catch (err) {
    console.warn(`fetchWithCache(${key}) failed:`, err)
    if (cached === null) throw err
    // Had cached data to fall back on — swallow the error, stale data
    // beats a broken UI.
  }
}
