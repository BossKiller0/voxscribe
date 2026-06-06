import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { DatabaseService } from '../services/DatabaseService'
import { logger } from '../logger'

const getDb = () => DatabaseService.getInstance()

export function registerSnippetsIPC(): void {
  ipcMain.handle(IPC.SNIPPETS_GET, () => {
    return getDb().getSnippets()
  })

  ipcMain.handle(IPC.SNIPPETS_SAVE, (_, payload: { trigger: string; expansion: string }) => {
    getDb().upsertSnippet(payload.trigger, payload.expansion)
    logger.info(`[IPC:snippets] Saved snippet: "${payload.trigger}"`)
    return true
  })

  ipcMain.handle(IPC.SNIPPETS_DELETE, (_, id: number) => {
    getDb().deleteSnippet(id)
    logger.info(`[IPC:snippets] Deleted snippet ${id}`)
    return true
  })
}
