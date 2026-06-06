// ─── Enums ───────────────────────────────────────────────────────────────────

export type RecordingState = 'idle' | 'listening' | 'processing' | 'inserting' | 'error'

export type WritingStyle = 'casual' | 'professional' | 'technical' | 'executive' | 'friendly'

export type TranscriptionMode = 'fast' | 'accurate'

export type SupportedLanguage =
  | 'auto'
  | 'en'
  | 'hi'
  | 'kn'
  | 'ta'
  | 'te'
  | 'ml'

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  // API
  groqApiKey: string

  // Audio
  microphoneDeviceId: string
  noiseSuppressionEnabled: boolean
  echoCancellationEnabled: boolean
  silenceDetectionEnabled: boolean
  silenceThresholdDb: number

  // Transcription
  transcriptionMode: TranscriptionMode
  language: SupportedLanguage

  // AI Cleanup
  aiCleanupEnabled: boolean
  writingStyle: WritingStyle

  // Insertion
  clipboardInsertionEnabled: boolean
  insertionDelayMs: number

  // UI
  theme: 'dark' | 'light' | 'system'
  showFloatingOverlay: boolean
  overlayPosition: { x: number; y: number }

  // History
  historyRetentionDays: number
  historyEnabled: boolean

  // Hotkeys
  primaryHotkey: string
  commandPaletteHotkey: string

  // Startup
  launchOnStartup: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  groqApiKey: '',
  microphoneDeviceId: 'default',
  noiseSuppressionEnabled: true,
  echoCancellationEnabled: true,
  silenceDetectionEnabled: true,
  silenceThresholdDb: -40,
  transcriptionMode: 'fast',
  language: 'auto',
  aiCleanupEnabled: true,
  writingStyle: 'professional',
  clipboardInsertionEnabled: true,
  insertionDelayMs: 150,
  theme: 'dark',
  showFloatingOverlay: true,
  overlayPosition: { x: -1, y: -1 }, // -1 = auto-center
  historyRetentionDays: 30,
  historyEnabled: true,
  primaryHotkey: 'Ctrl+Alt+Space',
  commandPaletteHotkey: 'Ctrl+Shift+Enter',
  launchOnStartup: false
}

// ─── Dictation History ────────────────────────────────────────────────────────

export interface DictationEntry {
  id: number
  timestamp: string
  durationMs: number
  originalTranscript: string
  cleanedTranscript: string | null
  languageDetected: string | null
  writingStyle: WritingStyle | null
  wordCount: number
  appName: string | null
}

// ─── Snippets ─────────────────────────────────────────────────────────────────

export interface Snippet {
  id: number
  trigger: string
  expansion: string
  createdAt: string
}

// ─── Transcription ────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  success: boolean
  originalTranscript: string
  cleanedTranscript: string
  languageDetected: string
  durationMs: number
  error?: string
}

// ─── IPC Channel Names ────────────────────────────────────────────────────────

export const IPC = {
  // Audio / recording
  AUDIO_START_RECORDING: 'audio:start-recording',
  AUDIO_STOP_RECORDING: 'audio:stop-recording',
  AUDIO_BLOB_READY: 'audio:blob-ready',
  AUDIO_TRANSCRIBE: 'audio:transcribe',
  AUDIO_TRANSCRIPTION_COMPLETE: 'audio:transcription-complete',
  AUDIO_ERROR: 'audio:error',

  // State events (main → renderer)
  STATE_RECORDING_CHANGED: 'state:recording-changed',
  STATE_OVERLAY_SHOW: 'state:overlay-show',
  STATE_OVERLAY_HIDE: 'state:overlay-hide',
  STATE_COMMAND_PALETTE_SHOW: 'state:command-palette-show',
  STATE_COMMAND_PALETTE_HIDE: 'state:command-palette-hide',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',

  // History
  HISTORY_GET: 'history:get',
  HISTORY_DELETE: 'history:delete',
  HISTORY_CLEAR: 'history:clear',

  // Snippets
  SNIPPETS_GET: 'snippets:get',
  SNIPPETS_SAVE: 'snippets:save',
  SNIPPETS_DELETE: 'snippets:delete',

  // Vocabulary
  VOCABULARY_GET: 'vocabulary:get',
  VOCABULARY_SAVE: 'vocabulary:save',
  VOCABULARY_DELETE: 'vocabulary:delete',

  // Window management
  WINDOW_OPEN_DASHBOARD: 'window:open-dashboard',
  WINDOW_OPEN_SETTINGS: 'window:open-settings',
  WINDOW_MINIMIZE: 'window:minimize',

  // AI Commands
  AI_COMMAND_EXECUTE: 'ai:command-execute',

  // App info
  APP_GET_VERSION: 'app:get-version',
  APP_CHECK_UPDATE: 'app:check-update'
} as const
