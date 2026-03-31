import ElectronStore from 'electron-store'
import { Settings } from '../shared/types'

export interface DismissedEntry {
  id: string
  dismissedAt: number
}

const DISMISSED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

interface StoreSchema {
  settings: Settings
  dismissedBuilds: DismissedEntry[]
}

interface TypedStore {
  get(key: 'settings'): Settings
  set(key: 'settings', value: Settings): void
  get(key: 'dismissedBuilds'): DismissedEntry[]
  set(key: 'dismissedBuilds', value: DismissedEntry[]): void
}

const store = new ElectronStore<StoreSchema>({
  name: 'buildkite-tray',
  defaults: {
    settings: {
      apiToken: '',
      githubUsername: '',
      repoFilters: [],
      notifyOnFailure: true,
      notifyOnSuccess: true
    },
    dismissedBuilds: []
  }
}) as unknown as TypedStore

export function getSettings(): Settings {
  return store.get('settings')
}

export function saveSettings(settings: Settings): void {
  store.set('settings', settings)
}

export function getDismissedBuilds(): DismissedEntry[] {
  const cutoff = Date.now() - DISMISSED_MAX_AGE_MS
  return (store.get('dismissedBuilds') ?? []).filter((e) => e.dismissedAt > cutoff)
}

export function saveDismissedBuilds(ids: string[]): void {
  const cutoff = Date.now() - DISMISSED_MAX_AGE_MS
  const existing = store.get('dismissedBuilds') ?? []
  const existingMap = new Map(existing.map((e) => [e.id, e.dismissedAt]))
  const now = Date.now()
  const entries: DismissedEntry[] = ids
    .map((id) => ({ id, dismissedAt: existingMap.get(id) ?? now }))
    .filter((e) => e.dismissedAt > cutoff)
  store.set('dismissedBuilds', entries)
}
