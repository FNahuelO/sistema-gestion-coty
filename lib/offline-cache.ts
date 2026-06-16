const CACHE_PREFIX = 'coty-cafe-offline'

export const OFFLINE_CACHE_KEYS = {
  catalog: `${CACHE_PREFIX}-catalog`,
  settings: `${CACHE_PREFIX}-settings`,
} as const

type CacheEnvelope<T> = {
  data: T
  savedAt: number
}

export function setOfflineCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return
  try {
    const envelope: CacheEnvelope<T> = { data, savedAt: Date.now() }
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // localStorage lleno o no disponible
  }
}

export function getOfflineCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const envelope = JSON.parse(raw) as CacheEnvelope<T>
    return envelope.data ?? null
  } catch {
    return null
  }
}

export function getOfflineCacheAge(key: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const envelope = JSON.parse(raw) as CacheEnvelope<unknown>
    return envelope.savedAt ?? null
  } catch {
    return null
  }
}

export function isBrowserOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}
