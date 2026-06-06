import React, { useEffect, useState } from 'react'
import { useHistoryStore } from '../store/historyStore'
import type { DictationEntry } from '../../../shared/types'

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function HistoryCard({
  entry,
  onDelete,
  onCopy
}: {
  entry: DictationEntry
  onDelete: () => void
  onCopy: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const text = entry.cleanedTranscript || entry.originalTranscript

  return (
    <div
      style={{
        background: 'rgba(28, 28, 40, 0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '16px 20px',
        transition: 'border-color 0.15s ease'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(124,111,247,0.2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#8888a8' }}>{formatRelativeTime(entry.timestamp)}</span>
          {entry.writingStyle && (
            <span
              style={{
                fontSize: 11,
                color: '#7c6ff7',
                background: 'rgba(124,111,247,0.12)',
                border: '1px solid rgba(124,111,247,0.2)',
                padding: '2px 8px',
                borderRadius: 20,
                fontWeight: 500
              }}
            >
              {entry.writingStyle}
            </span>
          )}
          {entry.languageDetected && entry.languageDetected !== 'en' && (
            <span
              style={{
                fontSize: 11,
                color: '#f5a623',
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.2)',
                padding: '2px 8px',
                borderRadius: 20
              }}
            >
              {entry.languageDetected}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#555568' }}>
            {entry.wordCount} words · {Math.round(entry.durationMs / 1000)}s
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onCopy}
            title="Copy text"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: '#8888a8',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = '#c8c8d8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#8888a8'
            }}
          >
            Copy
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,80,80,0.15)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: '#885555',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,80,80,0.08)'
              e.currentTarget.style.color = '#ff8888'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#885555'
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Transcript text */}
      <p
        style={{
          fontSize: 14,
          color: '#c8c8d8',
          lineHeight: 1.65,
          cursor: 'pointer',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          overflow: expanded ? 'visible' : 'hidden'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {text}
      </p>

      {/* Show original if different */}
      {expanded && entry.cleanedTranscript && entry.originalTranscript !== entry.cleanedTranscript && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#555568', marginBottom: 4 }}>Original transcript:</div>
          <p style={{ fontSize: 12, color: '#666680', lineHeight: 1.5 }}>{entry.originalTranscript}</p>
        </div>
      )}
    </div>
  )
}

export function HistoryPage() {
  const { entries, isLoading, searchQuery, setSearchQuery, deleteEntry, clearHistory, loadHistory } =
    useHistoryStore()
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopyMsg('Copied!')
    setTimeout(() => setCopyMsg(''), 1500)
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      clearHistory()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '28px 36px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0' }}>Dictation History</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {copyMsg && (
              <span style={{ fontSize: 12, color: '#4cd964' }}>{copyMsg}</span>
            )}
            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,80,80,0.2)',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 13,
                  color: '#885555',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555568" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search transcriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              fontSize: 14,
              color: '#e8e8f0',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s'
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(124,111,247,0.4)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#555568', padding: 40 }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎙️</div>
            <div style={{ fontSize: 16, color: '#555568', marginBottom: 8 }}>No dictations yet</div>
            <div style={{ fontSize: 13, color: '#333345' }}>Press Ctrl+Alt+Space to start your first dictation</div>
          </div>
        ) : (
          entries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              onDelete={() => deleteEntry(entry.id)}
              onCopy={() => handleCopy(entry.cleanedTranscript || entry.originalTranscript)}
            />
          ))
        )}
      </div>
    </div>
  )
}
