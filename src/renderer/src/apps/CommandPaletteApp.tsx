import React, { useState, useEffect, useRef } from 'react'

const QUICK_COMMANDS = [
  'Rewrite professionally',
  'Summarize this',
  'Make shorter',
  'Make longer',
  'Fix grammar',
  'Translate to Hindi',
  'Translate to Kannada',
  'Convert to bullet points',
  'Create email',
  'Create LinkedIn post'
]

export function CommandPaletteApp() {
  const [query, setQuery] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query
    ? QUICK_COMMANDS.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : QUICK_COMMANDS

  useEffect(() => {
    inputRef.current?.focus()

    const unsub = window.flowAPI.onCommandPaletteShow(() => {
      setQuery('')
      setResult('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    })

    return () => unsub()
  }, [])

  const execute = async (command: string) => {
    setIsExecuting(true)
    setError('')
    try {
      const res = await window.flowAPI.executeAICommand(command, '')
      if (res.success) {
        setResult(res.result || '')
      } else {
        setError(res.error || 'Command failed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div
        style={{
          width: 560,
          background: 'rgba(18, 18, 26, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(124,111,247,0.3)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(124,111,247,0.1)'
        }}
      >
        {/* Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c6ff7" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command... (e.g. Rewrite professionally)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query) execute(query)
              if (e.key === 'Escape') window.flowAPI.closeCommandPalette()
            }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: '#e8e8f0',
              fontFamily: 'inherit'
            }}
          />
          {isExecuting && (
            <span style={{ fontSize: 12, color: '#7c6ff7' }}>Processing...</span>
          )}
        </div>

        {/* Command list */}
        {!result && (
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.map((cmd) => (
              <button
                key={cmd}
                onClick={() => execute(cmd)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124,111,247,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 16 }}>⚡</span>
                <span style={{ fontSize: 14, color: '#c8c8d8' }}>{cmd}</span>
              </button>
            ))}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: '#555568', marginBottom: 8 }}>Result inserted ✓</div>
            <p style={{ fontSize: 13, color: '#c8c8d8', lineHeight: 1.6 }}>{result}</p>
            <button
              onClick={() => { setResult(''); setQuery('') }}
              style={{
                marginTop: 12,
                padding: '7px 14px',
                background: 'rgba(124,111,247,0.1)',
                border: '1px solid rgba(124,111,247,0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: '#b8b4ff',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Run another command
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,80,80,0.1)' }}>
            <p style={{ fontSize: 12, color: '#ff6b6b' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            gap: 16,
            alignItems: 'center'
          }}
        >
          {[
            { key: 'Enter', label: 'Execute' },
            { key: 'Esc', label: 'Close' }
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <kbd style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#8888a8', fontFamily: 'monospace' }}>
                {key}
              </kbd>
              <span style={{ fontSize: 11, color: '#555568' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
