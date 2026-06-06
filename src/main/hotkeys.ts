import { globalShortcut } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import { logger } from './logger'
import { IPC } from '../shared/types'
import { showOverlay, sendToOverlay, showCommandPalette } from './ipc/window.ipc'

let isRecording = false

// Key states to track held keys
let isCtrlPressed = false
let isShiftPressed = false
let stopTimeout: NodeJS.Timeout | null = null

function handleKeyDown(event: any): void {
  const code = event.keycode
  if (code === UiohookKey.Ctrl || code === UiohookKey.CtrlRight) {
    isCtrlPressed = true
  } else if (code === UiohookKey.Shift || code === UiohookKey.ShiftRight) {
    isShiftPressed = true
  }

  if (isCtrlPressed && isShiftPressed) {
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      stopTimeout = null
      logger.info('[Hotkeys] Ctrl+Shift re-held - cancelling stop timeout')
    } else if (!isRecording) {
      logger.info('[Hotkeys] Ctrl+Shift held - starting dictation')
      startRecording()
    }
  }
}

function handleKeyUp(event: any): void {
  const code = event.keycode
  let stateChanged = false

  if (code === UiohookKey.Ctrl || code === UiohookKey.CtrlRight) {
    isCtrlPressed = false
    stateChanged = true
  } else if (code === UiohookKey.Shift || code === UiohookKey.ShiftRight) {
    isShiftPressed = false
    stateChanged = true
  }

  // If either of them is released, and we were recording, stop recording after a 250ms debounce
  if (stateChanged && (!isCtrlPressed || !isShiftPressed) && isRecording) {
    if (!stopTimeout) {
      stopTimeout = setTimeout(() => {
        if ((!isCtrlPressed || !isShiftPressed) && isRecording) {
          logger.info('[Hotkeys] Ctrl+Shift released (debounced) - stopping dictation')
          stopRecording()
        }
        stopTimeout = null
      }, 250)
    }
  }
}

export function registerHotkeys(): void {
  // Reset states
  isCtrlPressed = false
  isShiftPressed = false
  if (stopTimeout) {
    clearTimeout(stopTimeout)
    stopTimeout = null
  }

  // Listen for Ctrl+Shift press/release globally via uIOhook
  uIOhook.on('keydown', handleKeyDown)
  uIOhook.on('keyup', handleKeyUp)

  try {
    uIOhook.start()
    logger.info('[Hotkeys] Global keyboard hook started successfully')
  } catch (err: any) {
    logger.error(`[Hotkeys] Failed to start global keyboard hook: ${err.message}`)
  }

  // Secondary: Ctrl+Shift+Enter — command palette
  const cmdReg = globalShortcut.register('CommandOrControl+Shift+Return', () => {
    logger.info('[Hotkeys] Command palette triggered')
    showCommandPalette()
  })

  if (!cmdReg) {
    logger.warn('[Hotkeys] Failed to register Ctrl+Shift+Enter for command palette')
  }
}

export function unregisterHotkeys(): void {
  if (stopTimeout) {
    clearTimeout(stopTimeout)
    stopTimeout = null
  }

  uIOhook.off('keydown', handleKeyDown)
  uIOhook.off('keyup', handleKeyUp)
  try {
    uIOhook.stop()
    logger.info('[Hotkeys] Global keyboard hook stopped')
  } catch (err: any) {
    logger.error(`[Hotkeys] Failed to stop global keyboard hook: ${err.message}`)
  }

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

