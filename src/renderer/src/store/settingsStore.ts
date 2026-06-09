import { create } from 'zustand'
import { DEFAULT_SETTINGS } from '../../../shared/types'
import type { AppSettings } from '../../../shared/types'

interface SettingsStore {
  settings: AppSettings
  isLoaded: boolean

  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.voxScribeAPI.getSettings()
      set({ settings, isLoaded: true })
    } catch (err) {
      console.error('Failed to load settings:', err)
      set({ settings: DEFAULT_SETTINGS, isLoaded: true })
    }
  },

  updateSettings: async (updates) => {
    const current = get().settings
    const merged = { ...current, ...updates }
    set({ settings: merged })
    await window.voxScribeAPI.saveSettings(updates)
  },

  resetSettings: async () => {
    await window.voxScribeAPI.resetSettings()
    set({ settings: DEFAULT_SETTINGS })
  }
}))

// Auto-sync settings changes across all windows
if (typeof window !== 'undefined' && window.voxScribeAPI) {
  window.voxScribeAPI.onSettingsChanged((newSettings) => {
    useSettingsStore.setState({ settings: newSettings })
  })
}
