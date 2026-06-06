import React, { useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import { HomePage } from '../pages/HomePage'
import { HistoryPage } from '../pages/HistoryPage'
import { SnippetsPage } from '../pages/SnippetsPage'
import { VocabularyPage } from '../pages/VocabularyPage'
import { SettingsPage } from '../pages/SettingsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import { useUIStore } from '../store/uiStore'
import { useSettingsStore } from '../store/settingsStore'

export function DashboardApp() {
  const { activePage, setActivePage } = useUIStore()
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()

    // Listen for tray navigation
    const unsub = window.flowAPI.onNavigate((route) => {
      const map: Record<string, any> = {
        '/settings': 'settings',
        '/history': 'history',
        '/': 'home'
      }
      if (map[route]) setActivePage(map[route])
    })

    return () => unsub()
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />
      case 'history': return <HistoryPage />
      case 'snippets': return <SnippetsPage />
      case 'vocabulary': return <VocabularyPage />
      case 'settings': return <SettingsPage />
      case 'privacy': return <PrivacyPage />
      default: return <HomePage />
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        background: '#0f0f14',
        fontFamily: "'Inter', sans-serif",
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      {/* Custom title bar drag region */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 32,
          WebkitAppRegion: 'drag' as any,
          zIndex: 1000
        }}
      />

      <Sidebar />

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {renderPage()}
      </main>
    </div>
  )
}
