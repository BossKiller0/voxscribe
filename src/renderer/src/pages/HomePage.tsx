import React, { useEffect, useState } from 'react'
import { HotkeyBadge } from '../components/HotkeyBadge'
import { useHistoryStore } from '../store/historyStore'

export function HomePage() {
  const { entries, loadHistory } = useHistoryStore()
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    loadHistory()
    window.flowAPI.getVersion().then(setVersion).catch(() => {})
  }, [])

  const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0)
  const todayEntries = entries.filter((e) => {
    const today = new Date().toDateString()
    return new Date(e.timestamp).toDateString() === today
  })

  return (
    <div style={{ padding: '36px 40px', maxWidth: 820, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
          Welcome to FlowClone
        </h1>
        <p style={{ fontSize: 15, color: '#8888a8', lineHeight: 1.6 }}>
          System-wide voice dictation for Windows. Speak anywhere, anytime.
        </p>
      </div>

      {/* PRIMARY CTA — Hotkey display */}
      <div
        style={{
          padding: '32px 36px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(124, 111, 247, 0.15) 0%, rgba(247, 79, 110, 0.08) 100%)',
          border: '1px solid rgba(124, 111, 247, 0.25)',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: '#7c6ff7', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Primary Shortcut
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 8, lineHeight: 1.3 }}>
            Press to start dictating
          </h2>
          <p style={{ fontSize: 14, color: '#8888a8' }}>
            Works in any app — VS Code, Chrome, Word, Slack, and more
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <HotkeyBadge keys={['Ctrl', 'Alt', 'Space']} size="lg" />
          <span style={{ fontSize: 12, color: '#555568' }}>Toggle recording</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Dictations', value: entries.length, icon: '🎙️' },
          { label: "Today's Sessions", value: todayEntries.length, icon: '📅' },
          { label: 'Words Dictated', value: totalWords.toLocaleString(), icon: '✍️' }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '20px 24px',
              borderRadius: 14,
              background: 'rgba(28, 28, 40, 0.8)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: '#8888a8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* How to use */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: 16,
          background: 'rgba(28, 28, 40, 0.6)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 20 }}>
          How to Use
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            {
              step: '1',
              text: 'Click inside any text field in any app (VS Code, Chrome, Word...)',
              icon: '📍'
            },
            {
              step: '2',
              text: 'Press Ctrl+Alt+Space — the floating overlay appears and recording starts',
              icon: '🎙️'
            },
            {
              step: '3',
              text: 'Speak naturally. Press Ctrl+Alt+Space again to stop.',
              icon: '🗣️'
            },
            {
              step: '4',
              text: 'Your speech is transcribed, cleaned up by AI, and typed at your cursor',
              icon: '⚡'
            }
          ].map((step) => (
            <div key={step.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(124, 111, 247, 0.15)',
                  border: '1px solid rgba(124, 111, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#7c6ff7',
                  flexShrink: 0
                }}
              >
                {step.step}
              </div>
              <div style={{ fontSize: 14, color: '#b8b8c8', paddingTop: 4, lineHeight: 1.5 }}>
                {step.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Command palette hint */}
      <div
        style={{
          marginTop: 20,
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(28, 28, 40, 0.5)',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#c8c8d8', marginBottom: 3 }}>AI Command Palette</div>
          <div style={{ fontSize: 12, color: '#555568' }}>Rewrite, summarize, translate selected text</div>
        </div>
        <HotkeyBadge keys={['Ctrl', 'Shift', 'Enter']} size="sm" />
      </div>
    </div>
  )
}
