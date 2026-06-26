import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
import { createTray, destroyTray } from './tray'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { registerAudioIPC } from './ipc/audio.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { registerHistoryIPC, pruneOldHistory } from './ipc/history.ipc'
import { registerSnippetsIPC } from './ipc/snippets.ipc'
import { registerVocabularyIPC } from './ipc/vocabulary.ipc'
import { registerWindowIPC, setWindowRefs } from './ipc/window.ipc'
import { DatabaseService } from './services/DatabaseService'
import { ensureValidApiKey, registerApiKeyIPC } from './services/ApiKeyService'
import { logger } from './logger'
import { getSettingsStore } from './store'

// Load environment variables from .env
dotenv.config()

let dashboardWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let commandPaletteWindow: BrowserWindow | null = null
let isQuitting = false

function shouldStartHidden(): boolean {
  return process.argv.includes('--hidden') || app.getLoginItemSettings().wasOpenedAsHidden
}

function createDashboardWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f14',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    if (!shouldStartHidden()) {
      win.show()
    } else {
      logger.info('[App] Dashboard window started hidden')
    }
  })

  win.on('close', (e) => {
    if (isQuitting) {
      return
    }
    // Hide instead of closing so the app stays in tray
    e.preventDefault()
    win.hide()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function createOverlayWindow(): BrowserWindow {
  const winWidth = 400
  const winHeight = 220

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false, // Don't steal focus from target window
    hasShadow: false,
    type: 'toolbar',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Set highest always-on-top level and enable visibility on all workspaces (including fullscreen)
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Restore the window if it gets minimized (e.g. via Win+D / Show Desktop)
  win.on('minimize', () => {
    logger.info('[Overlay] Overlay window minimized, restoring it')
    win.restore()
  })

  // Centered at the bottom-middle of the primary display
  const { screen } = require('electron')
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const x = Math.round((width - winWidth) / 2)
  const y = Math.round(height - winHeight - 20) // 20px above the taskbar/bottom area
  win.setPosition(x, y)

  // Make the overlay window click-through (but forward mouse events so renderer can detect hovers)
  win.setIgnoreMouseEvents(true, { forward: true })

  // Prevent overlay window from holding focus (safety fallback on Windows)
  win.on('focus', () => {
    logger.info('[Overlay] Overlay window gained focus, blurring it to restore focus to active application')
    win.blur()
  })

  // Center overlay if screen metrics/resolution change
  screen.on('display-metrics-changed', () => {
    if (!win.isDestroyed()) {
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width: currentWidth, height: currentHeight } = primaryDisplay.workAreaSize
      const targetX = Math.round((currentWidth - winWidth) / 2)
      const targetY = Math.round(currentHeight - winHeight - 20)
      win.setPosition(targetX, targetY)
      logger.info(`[Overlay] Centered overlay on screen metrics change: (${targetX}, ${targetY})`)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/overlay.html'))
  }

  return win
}

function createCommandPaletteWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/command-palette.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/command-palette.html'))
  }

  return win
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  logger.info('[App] Another instance is already running. Quitting.')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      if (dashboardWindow.isMinimized()) {
        dashboardWindow.restore()
      }
      dashboardWindow.show()
      dashboardWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // Set app user model id for Windows
    electronApp.setAppUserModelId('com.voxscribe.windows')

    // Sync login item settings with launchOnStartup setting
    try {
      const store = getSettingsStore()
      const launchOnStartup = store.get('launchOnStartup')
      app.setLoginItemSettings({
        openAtLogin: !!launchOnStartup,
        path: app.getPath('exe'),
        args: launchOnStartup ? ['--hidden'] : []
      })
      logger.info(`[App] Synced login item settings: ${launchOnStartup}`)
    } catch (err: any) {
      logger.error(`[App] Failed to sync login item settings: ${err.message}`)
    }

    // Open DevTools with F12, ignore default shortcuts in dev
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Initialize database FIRST (async, sql.js)
    try {
      await DatabaseService.getInstance().initialize()
      logger.info('[App] Database initialized')
    } catch (err: any) {
      logger.error(`[App] Database initialization failed: ${err.message}`)
    }

    // Register API key IPC handlers
    registerApiKeyIPC()

    // Ensure valid API Key exists before proceeding
    await ensureValidApiKey()

    // Create windows
    dashboardWindow = createDashboardWindow()
    overlayWindow = createOverlayWindow()
    commandPaletteWindow = createCommandPaletteWindow()

    // Show the overlay window inactive immediately so the idle dot is visible
    if (overlayWindow) {
      overlayWindow.showInactive()
    }

    // Wire window refs for IPC
    setWindowRefs(dashboardWindow, overlayWindow, commandPaletteWindow)

    // Create system tray
    createTray(dashboardWindow)

    // Register all IPC handlers
    registerAudioIPC()
    registerSettingsIPC()
    registerHistoryIPC()
    registerSnippetsIPC()
    registerVocabularyIPC()
    registerWindowIPC()

    // Register global hotkeys
    registerHotkeys()

    // Prune old history on startup
    pruneOldHistory()

    logger.info('✅ VoxScribe Windows started successfully')
    logger.info(`📝 Hold Ctrl+Shift to start dictating`)
  })

  app.on('window-all-closed', () => {
    // On Windows, keep app running in tray
    if (process.platform !== 'darwin') {
      // Don't quit — stay in tray
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('will-quit', () => {
    unregisterHotkeys()
    destroyTray()
    logger.info('[App] Shutting down')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      dashboardWindow = createDashboardWindow()
    }
  })
}
