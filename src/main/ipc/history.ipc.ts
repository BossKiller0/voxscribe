import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { DatabaseService } from '../services/DatabaseService'
import { getSettingsStore } from '../store'
import { logger } from '../logger'

const getDb = () => DatabaseService.getInstance()

export function registerHistoryIPC(): void {
  ipcMain.handle(IPC.HISTORY_GET, (_, query?: string) => {
    return getDb().getHistory(query)
  })

  ipcMain.handle(IPC.HISTORY_DELETE, (_, id: number) => {
    getDb().deleteHistory(id)
    logger.info(`[IPC:history] Deleted entry ${id}`)
    return true
  })

  ipcMain.handle(IPC.HISTORY_CLEAR, () => {
    getDb().clearHistory()
    logger.info('[IPC:history] Cleared all history')
    return true
  })
}

// Scheduled pruning — call this on app start
export function pruneOldHistory(): void {
  const store = getSettingsStore()
  const retentionDays = store.get('historyRetentionDays') || 30
  getDb().pruneHistory(retentionDays)
  logger.info(`[History] Pruned entries older than ${retentionDays} days`)
}
