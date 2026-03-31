import { app, ipcMain, shell, BrowserWindow } from 'electron'
import { Settings } from '../shared/types'
import { getSettings, saveSettings, saveDismissedBuilds } from './store'
import {
  getCachedBuilds,
  getCachedCurrentUser,
  triggerRefresh,
  getLastError,
  getIsPolling,
  setDismissedBuilds
} from './poller'
import { getCachedOrgSlugs, fetchMineBuilds } from './buildkite'
import { setPinned } from './tray'

export function registerIpcHandlers(): void {
  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.handle('save-settings', (_event, settings: Settings) => {
    saveSettings(settings)
  })

  ipcMain.handle('get-builds', () => getCachedBuilds())

  ipcMain.handle('get-current-user', () => getCachedCurrentUser())

  ipcMain.handle('get-discovered-orgs', () => getCachedOrgSlugs())

  ipcMain.handle('get-mine-builds', async () => {
    const settings = getSettings()
    if (!settings.apiToken || !settings.githubUsername) return []
    return fetchMineBuilds(settings.apiToken, settings.githubUsername)
  })

  ipcMain.handle('get-debug-info', async () => {
    const settings = getSettings()
    const orgs = getCachedOrgSlugs()
    const totalBuilds = getCachedBuilds().length

    let liveProbe = 'not attempted'
    let sampleBranches: string[] = []
    if (settings.apiToken && orgs.length > 0) {
      try {
        const res = await fetch(
          `https://api.buildkite.com/v2/organizations/${orgs[0]}/builds?state[]=running&per_page=10`,
          { headers: { Authorization: `Bearer ${settings.apiToken}` } }
        )
        if (res.ok) {
          const builds = await res.json() as Array<{ branch: string; creator?: { id: string }; pipeline: { slug: string } }>
          liveProbe = `OK ${res.status} — ${builds.length} running builds returned`
          sampleBranches = builds.slice(0, 10).map((b) => `${b.pipeline.slug}@${b.branch}`)
        } else {
          liveProbe = `ERROR ${res.status} ${res.statusText}`
        }
      } catch (e) {
        liveProbe = `FETCH ERROR: ${e instanceof Error ? e.message : String(e)}`
      }
    }

    return { orgs, totalBuilds, liveProbe, sampleBranches }
  })

  ipcMain.handle('get-status', () => ({
    error: getLastError(),
    isPolling: getIsPolling()
  }))

  ipcMain.handle('set-dismissed-builds', (_event, ids: string[]) => {
    setDismissedBuilds(ids)
    saveDismissedBuilds(ids)
  })

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
