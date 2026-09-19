// Simple localStorage-backed cache for "last known good" data, so reads have
// something to show when the network fetch fails. Not a sync engine — just
// a fallback snapshot.

export function saveCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(`ledger:cache:${key}`, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — non-fatal, just means no offline fallback this time.
  }
}

export function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`ledger:cache:${key}`)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}