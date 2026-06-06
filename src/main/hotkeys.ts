import { globalShortcut } from 'electron'
import { logger } from './logger'
import { IPC } from '../shared/types'
import { showOverlay, hideOverlay, sendToOverlay } from './ipc/window.ipc'

let isRecording = false

export function registerHotkeys(): void {
  // Primary: Ctrl+Alt+Space — toggle recording
  const primaryReg = globalShortcut.register('CommandOrControl+Alt+Space', async () => {
    if (!isRecording) {
      startRecording()
    } else {
      stopRecording()
    }
  })

  if (!primaryReg) {
    logger.error('[Hotkeys] Failed to register Ctrl+Alt+Space — another app may have it')
  } else {
    logger.info('[Hotkeys] Ctrl+Alt+Space registered successfully')
  }

  // Secondary: Ctrl+Shift+Enter — command palette
  const cmdReg = globalShortcut.register('CommandOrControl+Shift+Return', () => {
    logger.info('[Hotkeys] Command palette triggered')
    sendToOverlay(IPC.STATE_COMMAND_PALETTE_SHOW)
  })

  if (!cmdReg) {
    logger.warn('[Hotkeys] Failed to register Ctrl+Shift+Enter for command palette')
  }
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll()
  logger.info('[Hotkeys] All hotkeys unregistered')
}

function startRecording(): void {
  isRecording = true
  logger.info('[Hotkeys] Recording started')
  showOverlay()
  sendToOverlay(IPC.STATE_RECORDING_CHANGED, 'listening')
}

function stopRecording(): void {
  isRecording = false
  logger.info('[Hotkeys] Recording stopped — requesting audio from renderer')
  sendToOverlay(IPC.STATE_RECORDING_CHANGED, 'processing')
  sendToOverlay(IPC.AUDIO_STOP_RECORDING)
}

export function getIsRecording(): boolean {
  return isRecording
}

export function setIsRecording(value: boolean): void {
  isRecording = value
}
