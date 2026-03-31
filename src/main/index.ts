import { app, BrowserWindow } from 'electron'
import { createPopupWindow, createTray, destroyTray, updateTrayIcon } from './tray'
import { destroyNotificationWindow, setNotificationTray } from './notification'
import { registerIpcHandlers } from './ipc'
import { getSettings, getDismissedBuilds } from './store'
import { prefetchOrganizations } from './buildkite'
import {
  startPoller,
  setMainWindow,
  stopPoller,
  getCachedBuilds,
  getCachedCurrentUser,
  setWindowVisible,
  setOnPollComplete,
  setOnDismissedBuildsChanged,
  acknowledgeBuilds,
  getLastAcknowledgedAt,
  getDismissedBuildIds,
  isMyBuild
} from './poller'

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Hide from macOS Dock
app.dock?.hide()

app.whenReady().then(async () => {
  registerIpcHandlers()

  const win = createPopupWindow()
  setMainWindow(win)
  const tray = createTray(win)
  setNotificationTray(tray)

  win.on('show', () => {
    setWindowVisible(true)
    acknowledgeBuilds()   // mark all current builds as seen — clears the icon
    updateTrayFromBuilds()
  })
  win.on('hide', () => setWindowVisible(false))

  // Update tray icon after every poll or when dismissed builds change
  setOnPollComplete(updateTrayFromBuilds)
  setOnDismissedBuildsChanged(updateTrayFromBuilds)

  // Seed dismissed build IDs before the first poll so the tray icon is correct
  // from the very first computation, without waiting for the renderer to load.
  try {
    setDismissedBuilds(getDismissedBuilds().map((e) => e.id))
  } catch {
    // Non-critical — dismissed IDs will be re-synced when the renderer loads.
  }

  // Warm the org cache immediately so the first mine fetch doesn't have to wait
  const { apiToken } = getSettings()
  if (apiToken) prefetchOrganizations(apiToken).catch(() => {})

  await startPoller()
})

function updateTrayFromBuilds(): void {
  const builds = getCachedBuilds()
  const currentUser = getCachedCurrentUser()
  const settings = getSettings()
  const lastAcknowledged = getLastAcknowledgedAt()
  const dismissed = getDismissedBuildIds()
  const myBuilds = currentUser
    ? builds.filter((b) => isMyBuild(b, currentUser, settings.githubUsername) && !dismissed.has(b.id))
    : []

  const ONE_DAY = 24 * 60 * 60 * 1000

  // Only surface finished builds that completed after the user last opened the
  // window — anything before that was already "seen" and should not drive the icon.
  const isNewFinished = (finishedAt: string | null): boolean =>
    !!finishedAt &&
    Date.now() - new Date(finishedAt).getTime() < ONE_DAY &&
    new Date(finishedAt).getTime() > lastAcknowledged

  const myBuildFailed = myBuilds.some((b) => b.state === 'failed' && isNewFinished(b.finishedAt))
  const myBuildPassed = myBuilds.some((b) => b.state === 'passed' && isNewFinished(b.finishedAt))
  const myBuildRunning = myBuilds.some(
    (b) => b.state === 'running' || b.state === 'scheduled'
  )

  if (myBuildFailed) {
    updateTrayIcon('failed')
  } else if (myBuildPassed) {
    updateTrayIcon('passed')
  } else if (myBuildRunning) {
    updateTrayIcon('running')
  } else {
    updateTrayIcon('idle')
  }
}

app.on('before-quit', () => {
  stopPoller()
  destroyTray()
  destroyNotificationWindow()
})

app.on('second-instance', () => {
  // The first instance will handle this
})

app.on('activate', () => {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length === 0) {
    const win = createPopupWindow()
    setMainWindow(win)
  }
})
