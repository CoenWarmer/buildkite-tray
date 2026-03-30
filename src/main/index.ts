import { app, BrowserWindow } from 'electron'
import { createPopupWindow, createTray, destroyTray, updateTrayIcon, unlockTrayIcon } from './tray'
import { destroyNotificationWindow, setNotificationTray } from './notification'
import { registerIpcHandlers } from './ipc'
import { getSettings } from './store'
import {
  startPoller,
  setMainWindow,
  stopPoller,
  getCachedBuilds,
  getCachedCurrentUser,
  setWindowVisible,
  setOnPollComplete,
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
    unlockTrayIcon()         // user opened the window — reset icon to live state
    updateTrayFromBuilds()   // immediately reflect current builds after unlock
  })
  win.on('hide', () => setWindowVisible(false))

  // Update tray icon after every poll so it always reflects the latest build state
  setOnPollComplete(updateTrayFromBuilds)

  await startPoller()
})

function updateTrayFromBuilds(): void {
  const builds = getCachedBuilds()
  const currentUser = getCachedCurrentUser()
  const settings = getSettings()
  const myBuilds = currentUser
    ? builds.filter((b) => isMyBuild(b, currentUser, settings.githubUsername))
    : []

  const ONE_DAY = 24 * 60 * 60 * 1000

  const myBuildFailed = myBuilds.some(
    (b) =>
      b.state === 'failed' &&
      b.finishedAt &&
      Date.now() - new Date(b.finishedAt).getTime() < ONE_DAY
  )
  const myBuildPassed = myBuilds.some(
    (b) =>
      b.state === 'passed' &&
      b.finishedAt &&
      Date.now() - new Date(b.finishedAt).getTime() < ONE_DAY
  )
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
