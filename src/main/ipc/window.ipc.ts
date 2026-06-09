import { ipcMain, BrowserWindow, app } from 'electron'
import { IPC } from '../../shared/types'
import { logger } from '../logger'
import { startRecording, stopRecording, setIsRecording } from '../hotkeys'

let dashboardWin: BrowserWindow | null = null
let overlayWin: BrowserWindow | null = null
let commandPaletteWin: BrowserWindow | null = null

export function setWindowRefs(
  dashboard: BrowserWindow | null,
  overlay: BrowserWindow | null,
  commandPalette: BrowserWindow | null
): void {
  dashboardWin = dashboard
  overlayWin = overlay
  commandPaletteWin = commandPalette
}

export function getDashboardWindow(): BrowserWindow | null {
  return dashboardWin
}

export function registerWindowIPC(): void {
  ipcMain.handle(IPC.WINDOW_OPEN_DASHBOARD, () => {
    if (dashboardWin && !dashboardWin.isDestroyed()) {
      dashboardWin.show()
      dashboardWin.focus()
      logger.info('[IPC:window] Opened dashboard')
    }
  })

  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
    if (dashboardWin && !dashboardWin.isDestroyed()) {
      dashboardWin.minimize()
    }
  })

  ipcMain.handle('window:maximize', () => {
    if (dashboardWin && !dashboardWin.isDestroyed()) {
      if (dashboardWin.isMaximized()) {
        dashboardWin.unmaximize()
      } else {
        dashboardWin.maximize()
      }
    }
  })

  ipcMain.handle('window:close', () => {
    if (dashboardWin && !dashboardWin.isDestroyed()) {
      dashboardWin.hide()
    }
  })

  ipcMain.handle('window:close-command-palette', () => {
    if (commandPaletteWin && !commandPaletteWin.isDestroyed()) {
      commandPaletteWin.hide()
    }
  })

  ipcMain.handle(IPC.APP_GET_VERSION, () => {
    return app.getVersion()
  })

  ipcMain.on('overlay:set-ignore-mouse-events', (_, ignore: boolean) => {
    if (overlayWin && !overlayWin.isDestroyed()) {
      if (ignore) {
        overlayWin.setIgnoreMouseEvents(true, { forward: true })
      } else {
        overlayWin.setIgnoreMouseEvents(false)
      }
    }
  })

  ipcMain.handle('overlay:start-recording', () => {
    startRecording()
  })

  ipcMain.handle('overlay:stop-recording', () => {
    stopRecording()
  })

  ipcMain.handle('overlay:cancel-recording', () => {
    setIsRecording(false)
    logger.info('[IPC:overlay] Recording cancelled from overlay UI')
  })
}

export function showOverlay(): void {
  if (overlayWin && !overlayWin.isDestroyed()) {
    const { screen } = require('electron')
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    const winBounds = overlayWin.getBounds()
    const x = Math.round((width - winBounds.width) / 2)
    const y = Math.round(height - winBounds.height - 20)
    overlayWin.setPosition(x, y)

    overlayWin.showInactive()
    overlayWin.webContents.send(IPC.STATE_OVERLAY_SHOW)
  }
}

export function hideOverlay(): void {
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.webContents.send(IPC.STATE_OVERLAY_HIDE)
    setTimeout(() => {
      if (overlayWin && !overlayWin.isDestroyed()) {
        overlayWin.hide()
      }
    }, 400) // Allow exit animation
  }
}

export function showCommandPalette(): void {
  if (commandPaletteWin && !commandPaletteWin.isDestroyed()) {
    commandPaletteWin.show()
    commandPaletteWin.focus()
    commandPaletteWin.webContents.send(IPC.STATE_COMMAND_PALETTE_SHOW)
  }
}

export function hideCommandPalette(): void {
  if (commandPaletteWin && !commandPaletteWin.isDestroyed()) {
    commandPaletteWin.hide()
  }
}

export function sendToOverlay(channel: string, ...args: any[]): void {
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.webContents.send(channel, ...args)
  }
}

export function sendToDashboard(channel: string, ...args: any[]): void {
  if (dashboardWin && !dashboardWin.isDestroyed()) {
    dashboardWin.webContents.send(channel, ...args)
  }
}
