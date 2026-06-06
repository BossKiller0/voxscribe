import React, { useEffect, useState } from 'react'

const DEFAULT_TERMS = ['Kubernetes', 'LangGraph', 'NearMe', 'Bhaskar']

export function VocabularyPage() {
  const [terms, setTerms] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const data = await window.voxScribeAPI.getVocabulary()
    setTerms(data)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const term = input.trim()
    if (!term) return
    await window.voxScribeAPI.addVocabularyTerm(term)
    setInput('')
    setSuccess(`"${term}" added!`)
    setTimeout(() => setSuccess(''), 1500)
    load()
  }

  const handleDelete = async (term: string) => {
    await window.voxScribeAPI.deleteVocabularyTerm(term)
    load()
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>
          Custom Vocabulary
        </h1>
        <p style={{ fontSize: 13, color: '#8888a8' }}>
          Add names, brands, and technical terms. The AI will always spell them correctly.
        </p>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="e.g. Kubernetes, LangGraph, Bhaskar..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(124,111,247,0.4)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #7c6ff7, #6b5ee6)',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap'
          }}
        >
          Add Term
        </button>
      </div>

      {success && (
        <div style={{ fontSize: 12, color: '#4cd964', marginBottom: 12 }}>{success}</div>
      )}

      {/* Tags grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {terms.length === 0 ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '40px 0', color: '#555568', fontSize: 14 }}>
            No vocabulary terms yet. Add some above!
          </div>
        ) : (
          terms.map((term) => (
            <div
              key={term}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(124,111,247,0.1)',
                border: '1px solid rgba(124,111,247,0.2)',
                borderRadius: 20,
                fontSize: 13,
                color: '#b8b4ff'
              }}
            >
              <span>{term}</span>
              <button
                onClick={() => handleDelete(term)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#7c6ff7',
                  padding: 0,
                  lineHeight: 1,
                  fontSize: 14,
                  display: 'flex'
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* Suggestion section */}
      {terms.length === 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 13, color: '#555568', marginBottom: 12 }}>Quick-add suggested terms:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DEFAULT_TERMS.map((t) => (
              <button
                key={t}
                onClick={async () => {
                  await window.voxScribeAPI.addVocabularyTerm(t)
                  load()
                }}
                style={{
                  padding: '5px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  fontSize: 13,
                  color: '#8888a8',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
