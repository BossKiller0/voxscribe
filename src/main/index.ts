import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
import { createTray } from './tray'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { registerAudioIPC } from './ipc/audio.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { registerHistoryIPC, pruneOldHistory } from './ipc/history.ipc'
import { registerSnippetsIPC } from './ipc/snippets.ipc'
import { registerVocabularyIPC } from './ipc/vocabulary.ipc'
import { registerWindowIPC, setWindowRefs } from './ipc/window.ipc'
import { DatabaseService } from './services/DatabaseService'
import { ensureValidApiKey } from './services/ApiKeyService'
import { logger } from './logger'

// Load environment variables from .env
dotenv.config()

let dashboardWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let commandPaletteWindow: BrowserWindow | null = null

function createDashboardWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: true,
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
    win.show()
  })

  win.on('close', (e) => {
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
  const win = new BrowserWindow({
    width: 280,
    height: 100,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false, // Don't steal focus from target window
    hasShadow: false,
    type: 'toolbar',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Position at bottom-right of primary display
  const { screen } = require('electron')
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  win.setPosition(width - 300, height - 120)

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

app.whenReady().then(async () => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.flowclone.windows')

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

  // Ensure valid API Key exists before proceeding
  await ensureValidApiKey()

  // Create windows
  dashboardWindow = createDashboardWindow()
  overlayWindow = createOverlayWindow()
  commandPaletteWindow = createCommandPaletteWindow()

  // Wire window refs for IPC
  setWindowRefs(dashboardWindow, overlayWindow)

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

  logger.info('✅ FlowClone Windows started successfully')
  logger.info(`📝 Press Ctrl+Alt+Space to start dictating`)
})

app.on('window-all-closed', () => {
  // On Windows, keep app running in tray
  if (process.platform !== 'darwin') {
    // Don't quit — stay in tray
  }
})

app.on('will-quit', () => {
  unregisterHotkeys()
  logger.info('[App] Shutting down')
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    dashboardWindow = createDashboardWindow()
  }
})
