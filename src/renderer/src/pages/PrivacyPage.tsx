import React from 'react'

export function PrivacyPage() {
  return (
    <div style={{ padding: '28px 36px', maxWidth: 680, height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 6 }}>
        Privacy & Data
      </h1>
      <p style={{ fontSize: 14, color: '#8888a8', marginBottom: 32, lineHeight: 1.6 }}>
        FlowClone is designed with your privacy in mind.
      </p>

      {[
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
            'Your GROQ_API_KEY is stored only in your local .env file and is never transmitted anywhere other than to Groq\'s servers for API authentication.'
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
      ].map((item) => (
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
