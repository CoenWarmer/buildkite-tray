import { useState, useCallback } from 'react'

const STORAGE_KEY = 'buildkite-tray:dismissed-builds'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface DismissedEntry {
  id: string
  dismissedAt: number
}

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const entries: DismissedEntry[] = JSON.parse(raw)
    const cutoff = Date.now() - MAX_AGE_MS
    return new Set(entries.filter((e) => e.dismissedAt > cutoff).map((e) => e.id))
  } catch {
    return new Set()
  }
}

function save(ids: Set<string>): void {
  try {
    const now = Date.now()
    // Preserve existing timestamps, assign now for new entries
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: DismissedEntry[] = raw ? JSON.parse(raw) : []
    const existingMap = new Map(existing.map((e) => [e.id, e.dismissedAt]))

    const entries: DismissedEntry[] = [...ids].map((id) => ({
      id,
      dismissedAt: existingMap.get(id) ?? now
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function useDismissedBuilds(): {
  dismissedIds: Set<string>
  dismiss: (buildId: string) => void
} {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const ids = load()
    // Sync persisted dismissals to the main process on startup
    window.api.setDismissedBuilds([...ids])
    return ids
  })

  const dismiss = useCallback((buildId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(buildId)
      save(next)
      window.api.setDismissedBuilds([...next])
      return next
    })
  }, [])

  return { dismissedIds, dismiss }
}
