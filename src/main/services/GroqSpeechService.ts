import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { logger } from '../logger'
import type { ITranscriptionProvider } from './interfaces'
import type { TranscriptionResult } from '../../shared/types'
import { getSettingsStore } from '../store'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

export class GroqSpeechService implements ITranscriptionProvider {
  private client: Groq
  private fastModel: string
  private accurateModel: string
  private useAccurateMode: boolean

  constructor(useAccurateMode = false) {
    const apiKey = getSettingsStore().get('groqApiKey') || process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('Groq API Key is not set in settings or environment')
    }
    this.client = new Groq({ apiKey })
    this.fastModel = process.env.GROQ_SPEECH_MODEL_FAST || 'whisper-large-v3-turbo'
    this.accurateModel = process.env.GROQ_SPEECH_MODEL_ACCURATE || 'whisper-large-v3'
    this.useAccurateMode = useAccurateMode
    logger.info(`[Groq] Initialized. Fast=${this.fastModel}, Accurate=${this.accurateModel}`)
  }

  setAccurateMode(enabled: boolean): void {
    this.useAccurateMode = enabled
  }

  get currentModel(): string {
    return this.useAccurateMode ? this.accurateModel : this.fastModel
  }

  async transcribeAudio(audioPath: string, language?: string): Promise<TranscriptionResult> {
    const startTime = Date.now()
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(`[Groq] Transcribing ${path.basename(audioPath)} (attempt ${attempt}/${MAX_RETRIES})`)

        if (!fs.existsSync(audioPath)) {
          throw new Error(`Audio file not found: ${audioPath}`)
        }

        const transcription = await this.client.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: this.currentModel,
          response_format: 'verbose_json',
          ...(language && language !== 'auto' ? { language } : {})
        })

        const durationMs = Date.now() - startTime
        const detectedLang = (transcription as any).language || language || 'en'

        logger.info(`[Groq] Transcription complete in ${durationMs}ms. Lang: ${detectedLang}`)

        return {
          success: true,
          originalTranscript: transcription.text,
          cleanedTranscript: transcription.text,
          languageDetected: detectedLang,
          durationMs
        }
      } catch (err: any) {
        lastError = err
        logger.warn(`[Groq] Attempt ${attempt} failed: ${err.message}`)

        // Don't retry on auth errors
        if (err.status === 401 || err.status === 403) {
          break
        }

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt)
        }
      }
    }

    const durationMs = Date.now() - startTime
    logger.error(`[Groq] Transcription failed after ${MAX_RETRIES} attempts: ${lastError?.message}`)

    return {
      success: false,
      originalTranscript: '',
      cleanedTranscript: '',
      languageDetected: 'unknown',
      durationMs,
      error: lastError?.message || 'Transcription failed'
    }
  }

  async translateAudio(audioPath: string): Promise<string> {
    try {
      const translation = await this.client.audio.translations.create({
        file: fs.createReadStream(audioPath),
        model: this.accurateModel,
        response_format: 'json'
      })
      return translation.text
    } catch (err: any) {
      logger.error(`[Groq] Translation failed: ${err.message}`)
      throw err
    }
  }

  async detectLanguage(audioPath: string): Promise<string> {
    try {
      const result = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: this.fastModel,
        response_format: 'verbose_json'
      })
      return (result as any).language || 'en'
    } catch (err: any) {
      logger.error(`[Groq] Language detection failed: ${err.message}`)
      return 'en'
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
