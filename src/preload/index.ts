import { contextBridge, ipcRenderer } from 'electron'
import { Build, CurrentUser, IpcApi, PollStatus, Settings } from '../shared/types'

const api: IpcApi = {
  getSettings: (): Promise<Settings> =>
    ipcRenderer.invoke('get-settings'),

  saveSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke('save-settings', settings),

  getBuilds: (): Promise<Build[]> =>
    ipcRenderer.invoke('get-builds'),

  getStatus: (): Promise<PollStatus> =>
    ipcRenderer.invoke('get-status'),

  getCurrentUser: (): Promise<CurrentUser | null> =>
    ipcRenderer.invoke('get-current-user'),

  getMineBuilds: (): Promise<Build[]> =>
    ipcRenderer.invoke('get-mine-builds'),

  getDiscoveredOrgs: (): Promise<string[]> =>
    ipcRenderer.invoke('get-discovered-orgs'),

  getDebugInfo: () => ipcRenderer.invoke('get-debug-info'),

  setDismissedBuilds: (ids: string[]): Promise<void> =>
    ipcRenderer.invoke('set-dismissed-builds', ids),

  refresh: (): Promise<void> =>
    ipcRenderer.invoke('refresh'),

  setPinned: (value: boolean): Promise<void> =>
    ipcRenderer.invoke('set-pinned', value),

  quit: (): Promise<void> =>
    ipcRenderer.invoke('quit'),

  openUrl: (url: string): Promise<void> =>
    ipcRenderer.invoke('open-url', url),

  onBuildsUpdated: (callback: (builds: Build[]) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, builds: Build[]): void => callback(builds)
    ipcRenderer.on('builds-updated', handler)
    return () => ipcRenderer.removeListener('builds-updated', handler)
  },

  onPollError: (callback: (error: string | null) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, error: string | null): void => callback(error)
    ipcRenderer.on('poll-error', handler)
    return () => ipcRenderer.removeListener('poll-error', handler)
  },

  onPinnedChanged: (callback: (pinned: boolean) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, value: boolean): void => callback(value)
    ipcRenderer.on('pinned-changed', handler)
    return () => ipcRenderer.removeListener('pinned-changed', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
