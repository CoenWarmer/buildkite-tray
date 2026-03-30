import { contextBridge, ipcRenderer } from 'electron'
import { Build } from '../shared/types'

contextBridge.exposeInMainWorld('notification', {
  ready: () => ipcRenderer.send('notification-ready'),
  onBuild: (cb: (build: Build) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, build: Build) => cb(build)
    ipcRenderer.on('notification-build', handler)
    return () => ipcRenderer.removeListener('notification-build', handler)
  },
  resize: (height: number) => ipcRenderer.send('notification-resize', height),
  close: () => ipcRenderer.send('notification-close'),
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url)
})
