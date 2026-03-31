import { app, BrowserWindow, Tray, nativeImage, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let tray: Tray | null = null
let popupWindow: BrowserWindow | null = null
let pinned = false

function getIconPath(name: string): string {
  if (is.dev) {
    return join(process.cwd(), 'resources', name)
  }
  return join(process.resourcesPath, name)
}

type TrayState = 'idle' | 'running' | 'passed' | 'failed'

function createTrayIcon(state: TrayState): Electron.NativeImage {
  const nameMap: Record<TrayState, string> = {
    idle: 'tray-idle',
    running: 'tray-running',
    passed: 'tray-passed',
    failed: 'tray-failed'
  }
  const image = nativeImage.createFromPath(getIconPath(`${nameMap[state]}.png`))
  if (image.isEmpty()) return nativeImage.createEmpty()
  image.setTemplateImage(state === 'idle')
  return image
}

export function createPopupWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 400,
    height: 560,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: '#1a1a2e',
    vibrancy: 'popover',
    visualEffectState: 'active',
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('blur', () => {
    if (!pinned && !win.webContents.isDevToolsOpened()) {
      win.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/main/index.html`)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../renderer/main/index.html'))
  }

  return win
}

function positionWindow(win: BrowserWindow): void {
  if (!tray) return
  const trayBounds = tray.getBounds()
  const windowBounds = win.getBounds()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const { x: wx, y: wy, width: ww, height: wh } = display.workArea

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
  let y = Math.round(trayBounds.y + trayBounds.height + 4)

  x = Math.max(wx, Math.min(x, wx + ww - windowBounds.width))
  y = Math.max(wy, Math.min(y, wy + wh - windowBounds.height))

  win.setPosition(x, y)
}

export function createTray(win: BrowserWindow): Tray {
  popupWindow = win
  tray = new Tray(createTrayIcon('idle'))
  tray.setToolTip('Buildkite Tray')
  tray.on('click', toggleWindow)
  return tray
}

export function toggleWindow(): void {
  if (!popupWindow) return
  if (popupWindow.isVisible()) {
    if (popupWindow.isFocused() && !pinned) {
      // Already focused — hide it (toggle off)
      popupWindow.hide()
    } else {
      // Visible but not focused — bring it to front
      popupWindow.focus()
    }
  } else {
    if (!pinned) positionWindow(popupWindow)
    popupWindow.show()
    popupWindow.focus()
  }
}

export function setPinned(win: BrowserWindow, value: boolean): void {
  pinned = value
  win.setResizable(value)
  win.setMovable(value)
  win.setAlwaysOnTop(!value)

  if (!value) {
    // Reset to original popup dimensions and reposition under tray icon
    win.setSize(400, 560)
    positionWindow(win)
  }

  // Notify renderer so it can update drag region + button state
  win.webContents.send('pinned-changed', value)
}

export function updateTrayIcon(state: TrayState): void {
  if (!tray) return
  tray.setImage(createTrayIcon(state))
  tray.setToolTip({
    idle: 'Buildkite Tray',
    running: 'Buildkite Tray — Build running',
    passed: 'Buildkite Tray — Build passed',
    failed: 'Buildkite Tray — Build failed!'
  }[state])
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}

export function setupAppBehaviour(): void {
  app.on('window-all-closed', () => {
  })
}
