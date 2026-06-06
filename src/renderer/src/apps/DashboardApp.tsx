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
      {/* Custom title bar drag region & window controls */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 32,
          WebkitAppRegion: 'drag' as any,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingRight: 8
        }}
      >
        <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' as any }}>
          {/* Minimize */}
          <button
            onClick={() => window.flowAPI.minimizeToDashboard()}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: '#d1d1e6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#d1d1e6'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          
          {/* Maximize */}
          <button
            onClick={() => window.flowAPI.maximizeWindow()}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: '#d1d1e6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#d1d1e6'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={() => window.flowAPI.closeWindow()}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: '#d1d1e6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(247, 79, 110, 0.25)'
              e.currentTarget.style.color = '#ff6b8b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#d1d1e6'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <Sidebar />

      <main style={{ flex: 1, overflow: 'hidden', position: 'relative', paddingTop: 32 }}>
        {renderPage()}
      </main>
    </div>
  )
}
