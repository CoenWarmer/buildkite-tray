import { BrowserWindow, ipcMain, screen, Tray } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { Build } from '../shared/types'

let notificationWin: BrowserWindow | null = null
let trayRef: Tray | null = null

// Track builds we've already notified about this session
const notifiedBuildIds = new Set<string>()
// Build waiting to be sent once the renderer signals it's ready
let pendingBuild: Build | null = null

export function setNotificationTray(tray: Tray): void {
  trayRef = tray
}

export function getNotifiedBuildIds(): Set<string> {
  return notifiedBuildIds
}

function positionBelowTray(win: BrowserWindow): void {
  if (!trayRef) return
  const trayBounds = trayRef.getBounds()
  const [ww, wh] = win.getSize()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const { x: ax, y: ay, width: aw } = display.workArea

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - ww / 2)
  const y = Math.round(trayBounds.y + trayBounds.height + 4)
  x = Math.max(ax, Math.min(x, ax + aw - ww))

  win.setSize(ww, wh)
  win.setPosition(x, y)
}

function getOrCreateWindow(): BrowserWindow {
  if (notificationWin && !notificationWin.isDestroyed()) return notificationWin

  notificationWin = new BrowserWindow({
    width: 380,
    height: 200,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: '#1a1a2e',
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/notification.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // electron-vite serves the notification entry at /notification/index.html
    notificationWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/notification/index.html`)
  } else {
    notificationWin.loadFile(join(__dirname, '../renderer/notification/index.html'))
  }

  // Renderer signals it has mounted and is ready to receive build data
  ipcMain.on('notification-ready', () => {
    if (pendingBuild && notificationWin && !notificationWin.isDestroyed()) {
      notificationWin.webContents.send('notification-build', pendingBuild)
      pendingBuild = null
    }
  })

  ipcMain.on('notification-resize', (_e, height: number) => {
    if (!notificationWin || notificationWin.isDestroyed()) return
    notificationWin.setSize(380, Math.ceil(height))
    positionBelowTray(notificationWin)
  })

  ipcMain.on('notification-close', () => {
    notificationWin?.hide()
  })

  return notificationWin
}

export function showBuildNotification(build: Build): void {
  if (notifiedBuildIds.has(build.id)) return
  notifiedBuildIds.add(build.id)

  const win = getOrCreateWindow()
  pendingBuild = build

  const show = () => {
    // If renderer is already loaded and listening, send immediately
    if (!win.webContents.isLoading()) {
      win.webContents.send('notification-build', build)
      pendingBuild = null
    }
    // Otherwise notification-ready IPC will deliver it once React mounts

    win.setOpacity(0)
    positionBelowTray(win)
    win.showInactive()

    let opacity = 0
    const fadeIn = setInterval(() => {
      opacity = Math.min(1, opacity + 0.1)
      win.setOpacity(opacity)
      if (opacity >= 1) clearInterval(fadeIn)
    }, 16)
  }

  if (win.webContents.isLoading()) {
    win.webContents.once('did-finish-load', show)
  } else {
    show()
  }
}

export function destroyNotificationWindow(): void {
  notificationWin?.destroy()
  notificationWin = null
}
