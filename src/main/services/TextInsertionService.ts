import { clipboard } from 'electron'
import { logger } from '../logger'

// Dynamic import to handle module loading
let nutjs: typeof import('@nut-tree-fork/nut-js') | null = null

async function getNutJs() {
  if (!nutjs) {
    try {
      nutjs = await import('@nut-tree-fork/nut-js')
    } catch (err) {
      logger.warn('[TextInsertion] @nut-tree-fork/nut-js not available, using clipboard-only mode')
    }
  }
  return nutjs
}

export class TextInsertionService {
  private static readonly RESTORE_DELAY_MS = 300
  private static readonly PASTE_DELAY_MS = 100

  /**
   * Insert text at the current cursor position in the active window.
   * Strategy:
   * 1. Save current clipboard
   * 2. Copy target text to clipboard
   * 3. Simulate Ctrl+V
   * 4. Restore original clipboard after a short delay
   */
  static async insertText(text: string): Promise<void> {
    if (!text.trim()) {
      logger.warn('[TextInsertion] Empty text, skipping')
      return
    }

    logger.info(`[TextInsertion] Inserting ${text.length} chars`)

    // 1. Save original clipboard
    const originalText = clipboard.readText()
    const originalImage = clipboard.readImage()
    const hasImage = !originalImage.isEmpty()

    try {
      // 2. Write new text to clipboard
      clipboard.writeText(text)

      // 3. Brief pause to let clipboard settle
      await sleep(TextInsertionService.PASTE_DELAY_MS)

      // 4. Simulate Ctrl+V using nut-js
      const nut = await getNutJs()
      if (nut) {
        const { keyboard, Key } = nut
        await keyboard.pressKey(Key.LeftControl, Key.V)
        await keyboard.releaseKey(Key.LeftControl, Key.V)
        logger.info('[TextInsertion] Ctrl+V sent via nut-js')
      } else {
        // Fallback: manually simulate using Electron shell (limited)
        logger.warn('[TextInsertion] nut-js unavailable — clipboard set but Ctrl+V not simulated')
      }

      // 5. Restore original clipboard after delay
      setTimeout(() => {
        if (hasImage) {
          // If there was an image, we can't perfectly restore it via Electron's API
          clipboard.writeText(originalText || '')
        } else {
          clipboard.writeText(originalText || '')
        }
        logger.info('[TextInsertion] Clipboard restored')
      }, TextInsertionService.RESTORE_DELAY_MS)
    } catch (err: any) {
      logger.error(`[TextInsertion] Failed: ${err.message}`)
      // Always try to restore clipboard on failure
      try {
        clipboard.writeText(originalText || '')
      } catch (_) {}
      throw err
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
