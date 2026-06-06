import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { GroqSpeechService } from '../services/GroqSpeechService'
import { AIEditorService } from '../services/AIEditorService'
import { AudioRecordingService } from '../services/AudioRecordingService'
import { TextInsertionService } from '../services/TextInsertionService'
import { DatabaseService } from '../services/DatabaseService'
import { getSettingsStore } from '../store'
import { ensureValidApiKey, isAuthError } from '../services/ApiKeyService'
import { logger } from '../logger'

let groqService: GroqSpeechService | null = null
let aiEditor: AIEditorService | null = null
let audioService: AudioRecordingService | null = null

function getDb() {
  return DatabaseService.getInstance()
}

function getAudioService(): AudioRecordingService {
  if (!audioService) audioService = new AudioRecordingService()
  return audioService
}

function getGroqService(): GroqSpeechService {
  if (!groqService) {
    const settings = getSettingsStore()
    groqService = new GroqSpeechService(settings.get('transcriptionMode') === 'accurate')
  }
  return groqService
}

function getAIEditor(): AIEditorService {
  if (!aiEditor) {
    aiEditor = new AIEditorService()
  }
  return aiEditor
}

export function resetGroqServices(): void {
  groqService = null
  aiEditor = null
}

export function registerAudioIPC(): void {
  // Receive audio blob from renderer, run full pipeline
  ipcMain.handle(IPC.AUDIO_TRANSCRIBE, async (_, payload: { buffer: ArrayBuffer; format: string }) => {
    const startTime = Date.now()
    logger.info('[IPC:audio] Transcription pipeline started')

    let audioPath: string | null = null

    try {
      const settings = getSettingsStore()
      const writingStyle = settings.get('writingStyle')
      const language = settings.get('language')
      const aiCleanupEnabled = settings.get('aiCleanupEnabled')
      const vocabulary = getDb().getVocabulary()

      // 1. Save audio to temp file
      audioPath = await getAudioService().saveAudioBlob(
        payload.buffer,
        (payload.format || 'webm') as any
      )

      // 2. Transcribe with Groq Whisper
      let speech = getGroqService()
      let result = await speech.transcribeAudio(audioPath, language === 'auto' ? undefined : language)

      if (!result.success && result.error && (result.error.includes('401') || result.error.includes('403') || result.error.toLowerCase().includes('api key') || result.error.toLowerCase().includes('apikey') || result.error.toLowerCase().includes('unauthorized'))) {
        logger.warn('[IPC:audio] API key exception detected during transcription. Prompting user...')
        await ensureValidApiKey(true, 'Your Groq API key is invalid or expired. Please update it.')
        resetGroqServices()
        speech = getGroqService()
        result = await speech.transcribeAudio(audioPath, language === 'auto' ? undefined : language)
      }

      if (!result.success || !result.originalTranscript.trim()) {
        return { success: false, error: result.error || 'Empty transcription' }
      }

      // 3. Check for snippet expansion
      const snippetExpansion = getDb().findSnippet(result.originalTranscript.trim())
      let finalText = snippetExpansion || result.originalTranscript

      // 4. AI Cleanup (if enabled and no snippet match)
      if (aiCleanupEnabled && !snippetExpansion) {
        try {
          let editor = getAIEditor()
          try {
            finalText = await editor.cleanupTranscript(result.originalTranscript, writingStyle, vocabulary)
          } catch (err: any) {
            if (isAuthError(err)) {
              logger.warn('[IPC:audio] API key exception detected during AI cleanup. Prompting user...')
              await ensureValidApiKey(true, 'Your Groq API key is invalid or expired. Please update it.')
              resetGroqServices()
              editor = getAIEditor()
              finalText = await editor.cleanupTranscript(result.originalTranscript, writingStyle, vocabulary)
            } else {
              throw err
            }
          }
        } catch (err: any) {
          logger.warn(`[IPC:audio] AI cleanup failed, using raw transcript: ${err.message}`)
          finalText = result.originalTranscript
        }
      }

      // 5. Insert text into active window
      await TextInsertionService.insertText(finalText)

      // 6. Save to history
      const totalDuration = Date.now() - startTime
      getDb().insertHistory({
        durationMs: totalDuration,
        originalTranscript: result.originalTranscript,
        cleanedTranscript: finalText,
        languageDetected: result.languageDetected,
        writingStyle,
        appName: undefined
      })

      logger.info(`[IPC:audio] Pipeline complete in ${totalDuration}ms`)

      return {
        success: true,
        originalTranscript: result.originalTranscript,
        cleanedTranscript: finalText,
        languageDetected: result.languageDetected,
        durationMs: totalDuration
      }
    } catch (err: any) {
      logger.error(`[IPC:audio] Pipeline error: ${err.message}`)
      return { success: false, error: err.message }
    } finally {
      // Always clean up temp audio file
      if (audioPath) {
        getAudioService().deleteAudioFile(audioPath)
      }
    }
  })

  // AI Command execution (for command palette / inline editing)
  ipcMain.handle(IPC.AI_COMMAND_EXECUTE, async (_, payload: { command: string; selectedText: string }) => {
    try {
      let editor = getAIEditor()
      let result: string
      try {
        result = await editor.executeCommand(payload.command, payload.selectedText)
      } catch (err: any) {
        if (isAuthError(err)) {
          logger.warn('[IPC:ai] API key exception detected during command execution. Prompting user...')
          await ensureValidApiKey(true, 'Your Groq API key is invalid or expired. Please update it.')
          resetGroqServices()
          editor = getAIEditor()
          result = await editor.executeCommand(payload.command, payload.selectedText)
        } else {
          throw err
        }
      }

      if (payload.selectedText) {
        await TextInsertionService.insertText(result)
      }

      return { success: true, result }
    } catch (err: any) {
      logger.error(`[IPC:ai] Command failed: ${err.message}`)
      return { success: false, error: err.message }
    }
  })
}
