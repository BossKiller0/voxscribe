import { create } from 'zustand'

type ActivePage = 'home' | 'history' | 'snippets' | 'vocabulary' | 'settings' | 'privacy'

interface UIStore {
  activePage: ActivePage
  sidebarCollapsed: boolean
  lastTranscriptionResult: { original: string; cleaned: string } | null
  showTranscriptionToast: boolean

  setActivePage: (page: ActivePage) => void
  toggleSidebar: () => void
  setLastTranscriptionResult: (result: { original: string; cleaned: string } | null) => void
  showToast: () => void
  hideToast: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  activePage: 'home',
  sidebarCollapsed: false,
  lastTranscriptionResult: null,
  showTranscriptionToast: false,

  setActivePage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setLastTranscriptionResult: (result) => set({ lastTranscriptionResult: result }),
  showToast: () => set({ showTranscriptionToast: true }),
  hideToast: () => set({ showTranscriptionToast: false })
}))
