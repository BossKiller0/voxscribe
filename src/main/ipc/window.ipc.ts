import { ipcMain, BrowserWindow, app } from 'electron'
import { IPC } from '../../shared/types'
import { logger } from '../logger'

let dashboardWin: BrowserWindow | null = null
let overlayWin: BrowserWindow | null = null

export function setWindowRefs(
  dashboard: BrowserWindow | null,
  overlay: BrowserWindow | null
): void {
  dashboardWin = dashboard
  overlayWin = overlay
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
      dashboardWin.hide()
    }
  })

  ipcMain.handle(IPC.APP_GET_VERSION, () => {
    return app.getVersion()
  })
}

export function showOverlay(): void {
  if (overlayWin && !overlayWin.isDestroyed()) {
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
