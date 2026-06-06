import React, { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export function PrivacyPage() {
  const { settings, loadSettings, updateSettings } = useSettingsStore()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    setApiKeyInput(settings.groqApiKey || '')
  }, [settings.groqApiKey])

  const handleSaveKey = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')
    
    const trimmedKey = apiKeyInput.trim()
    if (!trimmedKey) {
      setSaveStatus('error')
      setErrorMessage('API Key cannot be empty')
      setIsSaving(false)
      return
    }

    try {
      const validationResult = await window.flowAPI.submitApiKey(trimmedKey)
      if (validationResult.success) {
        await updateSettings({ groqApiKey: trimmedKey })
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setErrorMessage(validationResult.error || 'Invalid API Key')
      }
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message || 'Validation failed')
    } finally {
      setIsSaving(false)
    }
  }

  const items = [
    {
      icon: '🎙️',
      title: 'Audio Processing',
      color: '#7c6ff7',
      content:
        'Audio is recorded locally on your device and sent to Groq\'s API for transcription only. Raw audio files are deleted from your device immediately after transcription completes.'
    },
    {
      icon: '🔑',
      title: 'API Keys',
      color: '#f5a623',
      content:
        'Your Groq API key is stored securely in your local settings and is never transmitted anywhere other than to Groq\'s servers for API authentication.',
      customElement: (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="gsk_..."
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#e8e8f0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: apiKeyInput ? 'monospace' : 'inherit',
                  transition: 'all 0.2s ease'
                }}
              />
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8888a8',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0
                  }}
                >
                  {showKey ? '👁️' : '🙈'}
                </button>
              )}
            </div>
            <button
              onClick={handleSaveKey}
              disabled={isSaving}
              style={{
                background: '#7c6ff7',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(124, 111, 247, 0.2)',
                flexShrink: 0
              }}
            >
              {isSaving ? 'Saving...' : 'Save Key'}
            </button>
            {settings.groqApiKey && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to remove your API key? You will not be able to use the application or dictate text until a new valid Groq API key is provided.')) {
                    await window.flowAPI.removeApiKey()
                  }
                }}
                style={{
                  background: 'rgba(247, 79, 110, 0.12)',
                  color: '#f74f6e',
                  border: '1px solid rgba(247, 79, 110, 0.2)',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                Remove Key
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span
              onClick={() => window.flowAPI.openGroqConsole()}
              style={{
                fontSize: 11,
                color: '#7c6ff7',
                textDecoration: 'none',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Get API Key from Groq console ↗
            </span>
            {saveStatus === 'success' && (
              <span style={{ fontSize: 12, color: '#4cd964', fontWeight: 500 }}>✓ Key validated & saved</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ fontSize: 12, color: '#f74f6e', fontWeight: 500 }}>✗ {errorMessage}</span>
            )}
          </div>
        </div>
      )
    },
    {
      icon: '💾',
      title: 'Local Storage',
      color: '#4cd964',
      content:
        'Transcription history, snippets, vocabulary, and settings are stored locally in a SQLite database on your machine. No data is synced to the cloud.'
    },
    {
      icon: '☁️',
      title: 'Third-Party Services',
      color: '#f74f6e',
      content:
        'FlowClone uses Groq API (groq.com) for speech-to-text (Whisper models) and AI text cleanup (LLaMA models). Please review Groq\'s privacy policy at groq.com/privacy.'
    },
    {
      icon: '📋',
      title: 'Clipboard Access',
      color: '#00c8ff',
      content:
        'FlowClone temporarily uses your clipboard to insert text at the cursor position. Your original clipboard content is restored within 300ms after insertion.'
    },
    {
      icon: '🚫',
      title: 'No Telemetry',
      color: '#a8a8c8',
      content:
        'FlowClone does not collect any analytics, usage data, crash reports, or telemetry. Your usage is entirely private.'
    }
  ]

  return (
    <div style={{ padding: '28px 36px', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 6 }}>
        Privacy & Data
      </h1>
      <p style={{ fontSize: 14, color: '#8888a8', marginBottom: 32, lineHeight: 1.6 }}>
        FlowClone is designed with your privacy in mind.
      </p>

      {items.map((item) => (
        <div
          key={item.title}
          style={{
            padding: '20px 24px',
            background: 'rgba(28,28,40,0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            marginBottom: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: item.color }}>{item.title}</h3>
          </div>
          <p style={{ fontSize: 13, color: '#a8a8c8', lineHeight: 1.65 }}>{item.content}</p>
          {item.customElement}
        </div>
      ))}

      <div
        style={{
          marginTop: 24,
          padding: '16px 20px',
          background: 'rgba(124,111,247,0.08)',
          border: '1px solid rgba(124,111,247,0.2)',
          borderRadius: 12
        }}
      >
        <p style={{ fontSize: 13, color: '#8888a8', lineHeight: 1.6 }}>
          <strong style={{ color: '#b8b4ff' }}>Open Source:</strong> FlowClone is open source. You can inspect all source code to verify how your data is handled.
        </p>
      </div>
    </div>
  )
}

