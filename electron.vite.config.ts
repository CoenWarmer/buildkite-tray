import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['electron-store'] })]
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts'),
          notification: resolve('src/preload/notification.ts')
        }
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/main/index.html'),
          notification: resolve('src/renderer/notification/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/main/src')
      }
    },
    plugins: [react()]
  }
})
