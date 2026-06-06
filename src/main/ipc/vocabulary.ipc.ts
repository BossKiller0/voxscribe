import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { DatabaseService } from '../services/DatabaseService'
import { logger } from '../logger'

const getDb = () => DatabaseService.getInstance()

export function registerVocabularyIPC(): void {
  ipcMain.handle(IPC.VOCABULARY_GET, () => {
    return getDb().getVocabulary()
  })

  ipcMain.handle(IPC.VOCABULARY_SAVE, (_, term: string) => {
    getDb().addVocabularyTerm(term)
    logger.info(`[IPC:vocab] Added term: "${term}"`)
    return true
  })

  ipcMain.handle(IPC.VOCABULARY_DELETE, (_, term: string) => {
    getDb().deleteVocabularyTerm(term)
    logger.info(`[IPC:vocab] Deleted term: "${term}"`)
    return true
  })
}
