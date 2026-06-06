import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import path from 'path'
import { logger } from './logger'
import { IPC } from '../shared/types'
import { sendToOverlay } from './ipc/window.ipc'
import { getIsRecording } from './hotkeys'

let tray: Tray | null = null
let dashboardWindow: BrowserWindow | null = null

const ICON_SIZE = { width: 16, height: 16 }

function createFallbackIcon(isRecording = false): Electron.NativeImage {
  // Create a simple colored icon using raw pixel data
  // Teal = idle, Red = recording
  const size = 16
  const data = Buffer.alloc(size * size * 4)
  const r = isRecording ? 220 : 0
  const g = isRecording ? 50 : 210
  const b = isRecording ? 50 : 190

  for (let i = 0; i < size * size; i++) {
    const offset = i * 4
    data[offset] = r
    data[offset + 1] = g
    data[offset + 2] = b
    data[offset + 3] = 255
  }

  return nativeImage.createFromBuffer(data, { width: size, height: size })
}

function getTrayIcon(isRecording = false): Electron.NativeImage {
  const iconName = isRecording ? 'tray-recording.png' : 'tray.png'
  const iconPath = path.join(__dirname, `../../resources/${iconName}`)

  try {
    const image = nativeImage.createFromPath(iconPath)
    if (image.isEmpty()) {
      logger.warn(`[Tray] Icon at ${iconPath} is empty, using fallback.`)
      return createFallbackIcon(isRecording)
    }
    return image.resize(ICON_SIZE)
  } catch (err: any) {
    logger.error(`[Tray] Failed to load tray icon: ${err.message}`)
    return createFallbackIcon(isRecording)
  }
}

export function createTray(dashboard: BrowserWindow): Tray {
  dashboardWindow = dashboard

  const icon = getTrayIcon(false)
  tray = new Tray(icon)
  tray.setToolTip('FlowClone — Voice Dictation\nHold Ctrl+Shift to dictate')

  updateTrayMenu()

  tray.on('click', () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      if (dashboardWindow.isVisible()) {
        dashboardWindow.hide()
      } else {
        dashboardWindow.show()
        dashboardWindow.focus()
      }
    }
  })

  logger.info('[Tray] System tray created')
  return tray
}

export function updateTrayMenu(): void {
  if (!tray) return

  const recording = getIsRecording()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: recording ? '🔴 Stop Dictation' : '🎙️ Start Dictation (Ctrl+Shift)',
      click: () => {
        sendToOverlay(recording ? IPC.AUDIO_STOP_RECORDING : IPC.STATE_RECORDING_CHANGED, recording ? undefined : 'listening')
      }
    },
    { type: 'separator' },
    {
      label: '📊 Open Dashboard',
      click: () => {
        if (dashboardWindow && !dashboardWindow.isDestroyed()) {
          dashboardWindow.show()
          dashboardWindow.focus()
        }
      }
    },
    {
      label: '⚙️ Settings',
      click: () => {
        if (dashboardWindow && !dashboardWindow.isDestroyed()) {
          dashboardWindow.show()
          dashboardWindow.focus()
          dashboardWindow.webContents.send('navigate', '/settings')
        }
      }
    },
    { type: 'separator' },
    {
      label: `FlowClone v${app.getVersion()}`,
      enabled: false
    },
    {
      label: '❌ Exit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
    logger.info('[Tray] System tray destroyed')
  }
}

export function setTrayRecordingState(isRecording: boolean): void {
  if (!tray) return
  const icon = getTrayIcon(isRecording)
  tray.setImage(icon)
  tray.setToolTip(
    isRecording
      ? '🔴 FlowClone — Recording... (Release Ctrl+Shift to stop)'
      : '🎙️ FlowClone — Hold Ctrl+Shift to dictate'
  )
  updateTrayMenu()
}
