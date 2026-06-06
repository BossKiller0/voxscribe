import React, { useEffect, useState } from 'react'
import type { Snippet } from '../../../shared/types'

export function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [trigger, setTrigger] = useState('')
  const [expansion, setExpansion] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const data = await window.flowAPI.getSnippets()
    setSnippets(data)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!trigger.trim() || !expansion.trim()) {
      setError('Both trigger and expansion are required')
      return
    }
    await window.flowAPI.saveSnippet(trigger.trim(), expansion.trim())
    setTrigger('')
    setExpansion('')
    setError('')
    setSuccess('Snippet saved!')
    setTimeout(() => setSuccess(''), 1500)
    load()
  }

  const handleDelete = async (id: number) => {
    await window.flowAPI.deleteSnippet(id)
    load()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    fontSize: 14,
    color: '#e8e8f0',
    fontFamily: 'inherit',
    outline: 'none'
  }

  return (
    <div style={{ padding: '28px 36px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>Snippets</h1>
          <p style={{ fontSize: 13, color: '#8888a8' }}>Say a trigger word and it expands to the full text</p>
        </div>
      </div>

      {/* Add snippet form */}
      <div
        style={{
          background: 'rgba(28, 28, 40, 0.8)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0', marginBottom: 16 }}>Add Snippet</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8888a8', marginBottom: 6, display: 'block' }}>Trigger phrase</label>
            <input
              type="text"
              placeholder="e.g. my email"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(124,111,247,0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8888a8', marginBottom: 6, display: 'block' }}>Expansion</label>
            <input
              type="text"
              placeholder="e.g. user@example.com"
              value={expansion}
              onChange={(e) => setExpansion(e.target.value)}
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(124,111,247,0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>
        {error && <div style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 8 }}>{error}</div>}
        {success && <div style={{ fontSize: 12, color: '#4cd964', marginBottom: 8 }}>{success}</div>}
        <button
          onClick={handleAdd}
          style={{
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #7c6ff7, #6b5ee6)',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Add Snippet
        </button>
      </div>

      {/* Snippets list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {snippets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#555568', fontSize: 14 }}>
            No snippets yet. Add one above!
          </div>
        ) : (
          snippets.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(28,28,40,0.5)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#7c6ff7',
                    background: 'rgba(124,111,247,0.1)',
                    padding: '3px 10px',
                    borderRadius: 6
                  }}
                >
                  {s.trigger}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555568" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
                <span style={{ fontSize: 13, color: '#c8c8d8' }}>{s.expansion}</span>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,80,80,0.15)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  color: '#885555',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
