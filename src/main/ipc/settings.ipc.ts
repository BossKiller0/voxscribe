import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { getSettingsStore } from '../store'
import { logger } from '../logger'
import type { AppSettings } from '../../shared/types'

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
