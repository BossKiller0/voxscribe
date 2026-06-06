import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { logger } from '../logger'

export class AudioRecordingService {
  private static readonly TEMP_DIR_NAME = 'audio-temp'
  private tempDir: string

  constructor() {
    this.tempDir = path.join(app.getPath('userData'), AudioRecordingService.TEMP_DIR_NAME)
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
    logger.info(`[Audio] Temp dir: ${this.tempDir}`)
  }

  /**
   * Save an audio blob (ArrayBuffer) to a WAV file.
   * Returns the absolute path to the saved file.
   */
  async saveAudioBlob(arrayBuffer: ArrayBuffer, format: 'wav' | 'webm' | 'mp3' = 'webm'): Promise<string> {
    const filename = `recording_${Date.now()}.${format}`
    const filePath = path.join(this.tempDir, filename)

    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    const stats = fs.statSync(filePath)
    logger.info(`[Audio] Saved audio: ${filename} (${Math.round(stats.size / 1024)}KB)`)

    return filePath
  }

  /**
   * Delete a temporary audio file.
   */
  deleteAudioFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        logger.info(`[Audio] Deleted temp file: ${path.basename(filePath)}`)
      }
    } catch (err: any) {
      logger.warn(`[Audio] Failed to delete temp file: ${err.message}`)
    }
  }

  /**
   * Clean up all temp audio files older than 1 hour.
   */
  cleanup(): void {
    try {
      const files = fs.readdirSync(this.tempDir)
      const oneHourAgo = Date.now() - 60 * 60 * 1000

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        const stat = fs.statSync(filePath)
        if (stat.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath)
          logger.info(`[Audio] Cleaned up old temp file: ${file}`)
        }
      }
    } catch (err: any) {
      logger.warn(`[Audio] Cleanup error: ${err.message}`)
    }
  }
}
