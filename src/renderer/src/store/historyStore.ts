import { create } from 'zustand'
import type { DictationEntry } from '../../../shared/types'

interface HistoryStore {
  entries: DictationEntry[]
  searchQuery: string
  isLoading: boolean

  loadHistory: (query?: string) => Promise<void>
  setSearchQuery: (q: string) => void
  deleteEntry: (id: number) => Promise<void>
  clearHistory: () => Promise<void>
  prependEntry: (entry: DictationEntry) => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],
  searchQuery: '',
  isLoading: false,

  loadHistory: async (query) => {
    set({ isLoading: true })
    try {
      const entries = await window.flowAPI.getHistory(query)
      set({ entries, isLoading: false })
    } catch (err) {
      console.error('Failed to load history:', err)
      set({ isLoading: false })
    }
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q })
    get().loadHistory(q || undefined)
  },

  deleteEntry: async (id) => {
    await window.flowAPI.deleteHistory(id)
    set({ entries: get().entries.filter((e) => e.id !== id) })
  },

  clearHistory: async () => {
    await window.flowAPI.clearHistory()
    set({ entries: [] })
  },

  prependEntry: (entry) => {
    set({ entries: [entry, ...get().entries] })
  }
}))
