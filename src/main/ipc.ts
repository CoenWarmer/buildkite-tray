import { app, ipcMain, shell, BrowserWindow } from 'electron'
import { Settings } from '../shared/types'
import { getSettings, saveSettings } from './store'
import {
  getCachedBuilds,
  getCachedCurrentUser,
  triggerRefresh,
  getLastError,
  getIsPolling
} from './poller'
import { getCachedOrgSlugs } from './buildkite'
import { setPinned } from './tray'

export function registerIpcHandlers(): void {
  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.handle('save-settings', (_event, settings: Settings) => {
    saveSettings(settings)
  })

  ipcMain.handle('get-builds', () => getCachedBuilds())

  ipcMain.handle('get-current-user', () => getCachedCurrentUser())

  ipcMain.handle('get-discovered-orgs', () => getCachedOrgSlugs())

  ipcMain.handle('get-debug-info', () => ({
    orgs: getCachedOrgSlugs(),
    totalBuilds: getCachedBuilds().length,
    buildBranches: getCachedBuilds().slice(0, 20).map((b) => ({
      branch: b.branch,
      state: b.state,
      pipeline: b.pipelineSlug,
      creatorId: b.creatorId,
      authorEmail: b.authorEmail
    }))
  }))

  ipcMain.handle('get-status', () => ({
    error: getLastError(),
    isPolling: getIsPolling()
  }))

  ipcMain.handle('refresh', async (_event, resetUser = false) => {
    await triggerRefresh(resetUser)
  })

  ipcMain.handle('set-pinned', (event, value: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) setPinned(win, value)
  })

  ipcMain.handle('quit', () => {
    app.quit()
  })

  ipcMain.handle('open-url', (_event, url: string) => {
    shell.openExternal(url)
  })
}
