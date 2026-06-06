import React, { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import type { WritingStyle, SupportedLanguage, TranscriptionMode } from '../../../shared/types'

const STYLES: { value: WritingStyle; label: string; desc: string }[] = [
  { value: 'casual', label: 'Casual', desc: 'Conversational, like texting a friend' },
  { value: 'professional', label: 'Professional', desc: 'Polished, for business communication' },
  { value: 'technical', label: 'Technical', desc: 'Precise, domain-specific terminology' },
  { value: 'executive', label: 'Executive', desc: 'Concise and authoritative' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' }
]

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'ml', label: 'Malayalam' }
]

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 3 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: '#8888a8' }}>{subtitle}</p>}
    </div>
  )
}

function ToggleRow({
  label, desc, checked, onChange
}: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div>
        <div style={{ fontSize: 14, color: '#c8c8d8', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: '#555568', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
          background: checked ? '#7c6ff7' : 'rgba(255,255,255,0.1)',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
          }}
        />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useSettingsStore()
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setMics(devices.filter((d) => d.kind === 'audioinput'))
    })
  }, [])

  const save = async (updates: any) => {
    await updateSettings(updates)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: '#e8e8f0',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer'
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '28px 36px', maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0' }}>Settings</h1>
          {saved && <span style={{ fontSize: 12, color: '#4cd964' }}>✓ Saved</span>}
        </div>

        {/* Audio */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader title="Audio" subtitle="Microphone and recording preferences" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: '#8888a8', marginBottom: 8, display: 'block' }}>Microphone</label>
            <select
              value={settings.microphoneDeviceId}
              onChange={(e) => save({ microphoneDeviceId: e.target.value })}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="default">Default Microphone</option>
              {mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
          <ToggleRow
            label="Noise Suppression"
            desc="Reduces background noise during recording"
            checked={settings.noiseSuppressionEnabled}
            onChange={(v) => save({ noiseSuppressionEnabled: v })}
          />
          <ToggleRow
            label="Echo Cancellation"
            desc="Prevents microphone feedback"
            checked={settings.echoCancellationEnabled}
            onChange={(v) => save({ echoCancellationEnabled: v })}
          />
          <ToggleRow
            label="Silence Detection"
            desc="Automatically stops recording during extended silence"
            checked={settings.silenceDetectionEnabled}
            onChange={(v) => save({ silenceDetectionEnabled: v })}
          />
        </section>

        {/* Transcription */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader title="Transcription" subtitle="Speech-to-text model and language" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: '#8888a8', marginBottom: 8, display: 'block' }}>Language</label>
            <select
              value={settings.language}
              onChange={(e) => save({ language: e.target.value as SupportedLanguage })}
              style={selectStyle}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#8888a8', marginBottom: 10, display: 'block' }}>Model</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['fast', 'accurate'] as TranscriptionMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => save({ transcriptionMode: mode })}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: `1px solid ${settings.transcriptionMode === mode ? 'rgba(124,111,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: settings.transcriptionMode === mode ? 'rgba(124,111,247,0.15)' : 'transparent',
                    color: settings.transcriptionMode === mode ? '#b8b4ff' : '#8888a8',
                    fontSize: 13,
                    fontWeight: settings.transcriptionMode === mode ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  {mode === 'fast' ? '⚡ Fast Mode' : '🎯 Accurate Mode'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#555568', marginTop: 8 }}>
              Fast: whisper-large-v3-turbo · Accurate: whisper-large-v3
            </p>
          </div>
        </section>

        {/* AI Cleanup */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader title="AI Cleanup" subtitle="Filler word removal and grammar correction" />
          <ToggleRow
            label="AI Cleanup"
            desc="Remove ums, ahs, fix punctuation and grammar automatically"
            checked={settings.aiCleanupEnabled}
            onChange={(v) => save({ aiCleanupEnabled: v })}
          />
          {settings.aiCleanupEnabled && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#8888a8', marginBottom: 10, display: 'block' }}>Model</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['fast', 'accurate'] as ('fast' | 'accurate')[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => save({ aiCleanupMode: mode })}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 8,
                        border: `1px solid ${settings.aiCleanupMode === mode ? 'rgba(124,111,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: settings.aiCleanupMode === mode ? 'rgba(124,111,247,0.15)' : 'transparent',
                        color: settings.aiCleanupMode === mode ? '#b8b4ff' : '#8888a8',
                        fontSize: 13,
                        fontWeight: settings.aiCleanupMode === mode ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      {mode === 'fast' ? '⚡ Fast Mode' : '🎯 Accurate Mode'}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#555568', marginTop: 8 }}>
                  Fast: llama-3.1-8b-instant · Accurate: llama-3.3-70b-versatile
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#8888a8', marginBottom: 10, display: 'block' }}>Writing Style</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => save({ writingStyle: s.value })}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1px solid ${settings.writingStyle === s.value ? 'rgba(124,111,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        background: settings.writingStyle === s.value ? 'rgba(124,111,247,0.12)' : 'rgba(28,28,40,0.5)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit'
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: settings.writingStyle === s.value ? '#b8b4ff' : '#c8c8d8', marginBottom: 3 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#555568', lineHeight: 1.4 }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Insertion */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader title="Text Insertion" />
          <ToggleRow
            label="Clipboard Insertion"
            desc="Use clipboard + Ctrl+V to insert text (most reliable)"
            checked={settings.clipboardInsertionEnabled}
            onChange={(v) => save({ clipboardInsertionEnabled: v })}
          />
        </section>

        {/* History */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader title="History" />
          <ToggleRow
            label="Save History"
            desc="Store all dictations locally for review"
            checked={settings.historyEnabled}
            onChange={(v) => save({ historyEnabled: v })}
          />
          {settings.historyEnabled && (
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, color: '#8888a8', marginBottom: 8, display: 'block' }}>
                Retention: {settings.historyRetentionDays} days
              </label>
              <input
                type="range"
                min={1}
                max={365}
                value={settings.historyRetentionDays}
                onChange={(e) => save({ historyRetentionDays: parseInt(e.target.value) })}
                style={{ width: 200, accentColor: '#7c6ff7' }}
              />
            </div>
          )}
        </section>

        {/* Startup */}
        <section style={{ marginBottom: 36 }}>
          <SectionHeader title="System" />
          <ToggleRow
            label="Launch at Windows Startup"
            desc="Start VoxScribe automatically when Windows boots"
            checked={settings.launchOnStartup}
            onChange={(v) => save({ launchOnStartup: v })}
          />
        </section>
      </div>
    </div>
  )
}
