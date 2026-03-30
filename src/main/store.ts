import ElectronStore from 'electron-store'
import { Settings } from '../shared/types'

interface StoreSchema {
  settings: Settings
}

// Cast to a minimal typed interface: moduleResolution:"node" can't see
// the inherited get/set from the ESM-only conf base class, but Vite bundles
// electron-store correctly so they exist at runtime.
interface TypedStore {
  get(key: 'settings'): Settings
  set(key: 'settings', value: Settings): void
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
    }
  }
}) as unknown as TypedStore

export function getSettings(): Settings {
  return store.get('settings')
}

export function saveSettings(settings: Settings): void {
  store.set('settings', settings)
}
