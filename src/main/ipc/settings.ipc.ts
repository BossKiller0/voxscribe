import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { getSettingsStore } from '../store'
import { logger } from '../logger'
import type { AppSettings } from '../../shared/types'

import { resetGroqServices } from './audio.ipc'

export function registerSettingsIPC(): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    const store = getSettingsStore()
    return store.store
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_, updates: Partial<AppSettings>) => {
    const store = getSettingsStore()
    for (const [key, value] of Object.entries(updates)) {
      store.set(key as keyof AppSettings, value)
    }
    if ('groqApiKey' in updates) {
      resetGroqServices()
      if (updates.groqApiKey) {
        process.env.GROQ_API_KEY = updates.groqApiKey
      }
    }
    if ('launchOnStartup' in updates) {
      const { app } = require('electron')
      try {
        app.setLoginItemSettings({
          openAtLogin: !!updates.launchOnStartup,
          path: app.getPath('exe')
        })
        logger.info(`[IPC:settings] Set login item settings: ${updates.launchOnStartup}`)
      } catch (err: any) {
        logger.error(`[IPC:settings] Failed to set login item settings: ${err.message}`)
      }
    }
    logger.info(`[IPC:settings] Updated: ${Object.keys(updates).join(', ')}`)
    return true
  })

  ipcMain.handle(IPC.SETTINGS_RESET, () => {
    const store = getSettingsStore()
    store.clear()
    logger.info('[IPC:settings] Reset to defaults')
    return true
  })
}
