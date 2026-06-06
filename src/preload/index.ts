import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { AppSettings, DictationEntry, Snippet, TranscriptionResult } from '../shared/types'

// Expose a typed, secure API to renderer processes
const flowAPI = {
  // ─── Audio ─────────────────────────────────────────────────────────────────

  /**
   * Send audio blob to main process for transcription pipeline.
   * Returns the transcription result.
   */
  transcribeAudio: (buffer: ArrayBuffer, format: string): Promise<TranscriptionResult> =>
    ipcRenderer.invoke(IPC.AUDIO_TRANSCRIBE, { buffer, format }),

  /**
   * Execute an AI command on selected text.
   */
  executeAICommand: (command: string, selectedText: string): Promise<{ success: boolean; result?: string; error?: string }> =>
    ipcRenderer.invoke(IPC.AI_COMMAND_EXECUTE, { command, selectedText }),

  // ─── Settings ──────────────────────────────────────────────────────────────

  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SETTINGS_GET),

  saveSettings: (updates: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, updates),

  resetSettings: (): Promise<void> =>
    ipcRenderer.invoke(IPC.SETTINGS_RESET),

  // ─── History ───────────────────────────────────────────────────────────────

  getHistory: (query?: string): Promise<DictationEntry[]> =>
    ipcRenderer.invoke(IPC.HISTORY_GET, query),

  deleteHistory: (id: number): Promise<void> =>
    ipcRenderer.invoke(IPC.HISTORY_DELETE, id),

  clearHistory: (): Promise<void> =>
    ipcRenderer.invoke(IPC.HISTORY_CLEAR),

  // ─── Snippets ──────────────────────────────────────────────────────────────

  getSnippets: (): Promise<Snippet[]> =>
    ipcRenderer.invoke(IPC.SNIPPETS_GET),

  saveSnippet: (trigger: string, expansion: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SNIPPETS_SAVE, { trigger, expansion }),

  deleteSnippet: (id: number): Promise<void> =>
    ipcRenderer.invoke(IPC.SNIPPETS_DELETE, id),

  // ─── Vocabulary ────────────────────────────────────────────────────────────

  getVocabulary: (): Promise<string[]> =>
    ipcRenderer.invoke(IPC.VOCABULARY_GET),

  addVocabularyTerm: (term: string): Promise<void> =>
    ipcRenderer.invoke(IPC.VOCABULARY_SAVE, term),

  deleteVocabularyTerm: (term: string): Promise<void> =>
    ipcRenderer.invoke(IPC.VOCABULARY_DELETE, term),

  // ─── Window ────────────────────────────────────────────────────────────────

  openDashboard: (): Promise<void> =>
    ipcRenderer.invoke(IPC.WINDOW_OPEN_DASHBOARD),

  minimizeToDashboard: (): Promise<void> =>
    ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),

  getVersion: (): Promise<string> =>
    ipcRenderer.invoke(IPC.APP_GET_VERSION),

  // ─── Event Listeners (Main → Renderer) ────────────────────────────────────

  onRecordingStateChange: (callback: (state: string) => void) => {
    ipcRenderer.on(IPC.STATE_RECORDING_CHANGED, (_, state) => callback(state))
    return () => ipcRenderer.removeAllListeners(IPC.STATE_RECORDING_CHANGED)
  },

  onOverlayShow: (callback: () => void) => {
    ipcRenderer.on(IPC.STATE_OVERLAY_SHOW, () => callback())
    return () => ipcRenderer.removeAllListeners(IPC.STATE_OVERLAY_SHOW)
  },

  onOverlayHide: (callback: () => void) => {
    ipcRenderer.on(IPC.STATE_OVERLAY_HIDE, () => callback())
    return () => ipcRenderer.removeAllListeners(IPC.STATE_OVERLAY_HIDE)
  },

  onStopRecording: (callback: () => void) => {
    ipcRenderer.on(IPC.AUDIO_STOP_RECORDING, () => callback())
    return () => ipcRenderer.removeAllListeners(IPC.AUDIO_STOP_RECORDING)
  },

  onCommandPaletteShow: (callback: () => void) => {
    ipcRenderer.on(IPC.STATE_COMMAND_PALETTE_SHOW, () => callback())
    return () => ipcRenderer.removeAllListeners(IPC.STATE_COMMAND_PALETTE_SHOW)
  },

  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_, route) => callback(route))
    return () => ipcRenderer.removeAllListeners('navigate')
  },

  submitApiKey: (key: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('api-key:submit', key),

  openGroqConsole: (): Promise<void> =>
    ipcRenderer.invoke('api-key:open-console')
}

contextBridge.exposeInMainWorld('flowAPI', flowAPI)

export type FlowAPI = typeof flowAPI
