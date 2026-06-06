import React, { useEffect, useCallback, useState } from 'react'
import { useRecordingStore } from '../store/recordingStore'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useMicrophoneLevel } from '../hooks/useMicrophoneLevel'


const STATE_CONFIG = {
  idle: { label: 'Ready', color: '#7c6ff7', bg: 'rgba(124, 111, 247, 0.1)' },
  listening: { label: 'Listening...', color: '#f74f6e', bg: 'rgba(247, 79, 110, 0.15)' },
  processing: { label: 'Processing...', color: '#f5a623', bg: 'rgba(245, 166, 35, 0.12)' },
  inserting: { label: 'Inserting...', color: '#4cd964', bg: 'rgba(76, 217, 100, 0.12)' },
  error: { label: 'Error', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.12)' }
}

export function FloatingMicOverlay() {
  const { recordingState, setRecordingState, setLastError, lastError } = useRecordingStore()
  const { startRecording, stopRecording } = useAudioRecorder()
  const isListening = recordingState === 'listening'
  const level = useMicrophoneLevel(isListening)
  const [visible, setVisible] = useState(true)

  const config = STATE_CONFIG[recordingState]

  // Listen for IPC events from main process
  useEffect(() => {
    const unsubShow = window.flowAPI.onOverlayShow(() => setVisible(true))
    const unsubHide = window.flowAPI.onOverlayHide(() => {
      setTimeout(() => setVisible(false), 350)
    })

    const unsubRecording = window.flowAPI.onRecordingStateChange(async (state) => {
      if (state === 'listening') {
        setRecordingState('listening')
        await startRecording()
      }
    })

    const unsubStop = window.flowAPI.onStopRecording(async () => {
      setRecordingState('processing')
      const result = await stopRecording()

      if (!result) {
        setRecordingState('idle')
        return
      }

      try {
        const arrayBuffer = await result.blob.arrayBuffer()
        const transcriptionResult = await window.flowAPI.transcribeAudio(arrayBuffer, result.format)

        if (transcriptionResult.success) {
          setRecordingState('inserting')
          setTimeout(() => setRecordingState('idle'), 800)
        } else {
          setLastError(transcriptionResult.error || 'Transcription failed')
          setRecordingState('error')
          setTimeout(() => setRecordingState('idle'), 2500)
        }
      } catch (err: any) {
        setLastError(err.message)
        setRecordingState('error')
        setTimeout(() => setRecordingState('idle'), 2500)
      }
    })

    return () => {
      unsubShow()
      unsubHide()
      unsubRecording()
      unsubStop()
    }
  }, [startRecording, stopRecording, setRecordingState, setLastError])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        fontFamily: "'Inter', sans-serif",
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'transparent' }}
      />

      {/* Main overlay card */}
      <div
        className="relative flex items-center gap-3 px-5 py-3 rounded-2xl animate-slide-up"
        style={{
          background: 'rgba(15, 15, 20, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${config.color}30`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${config.color}20`,
          minWidth: 220
        }}
      >
        {/* Mic icon with state rings */}
        <div className="relative flex-shrink-0">
          {/* Pulse rings for listening state */}
          {isListening && (
            <>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: config.color,
                  opacity: 0.2,
                  animation: 'pulse-ring 1.5s ease-out infinite'
                }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: config.color,
                  opacity: 0.15,
                  animation: 'pulse-ring 1.5s ease-out 0.5s infinite'
                }}
              />
            </>
          )}

          {/* Mic circle */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center relative z-10"
            style={{
              background: config.bg,
              border: `1.5px solid ${config.color}60`,
              animation: isListening ? 'pulse-dot 1s ease-in-out infinite' : undefined
            }}
          >
            {recordingState === 'processing' ? (
              <ProcessingSpinner color={config.color} />
            ) : recordingState === 'inserting' ? (
              <CheckIcon color={config.color} />
            ) : recordingState === 'error' ? (
              <ErrorIcon />
            ) : (
              <MicIcon color={config.color} isActive={isListening} />
            )}
          </div>
        </div>

        {/* Text + waveform */}
        <div className="flex flex-col gap-0.5 flex-1">
          <span
            className="text-sm font-semibold leading-tight"
            style={{ color: config.color }}
          >
            {recordingState === 'error' && lastError
              ? lastError.substring(0, 35)
              : config.label}
          </span>

          {isListening && (
            <div className="flex items-end gap-0.5 h-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: 2,
                    background: config.color,
                    opacity: 0.7,
                    height: `${Math.max(20, Math.min(100, level * (0.5 + Math.sin(i * 0.8) * 0.5)))}%`,
                    animation: `waveform ${0.6 + i * 0.08}s ease-in-out infinite`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
          )}

          {recordingState === 'processing' && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              Transcribing audio...
            </span>
          )}
        </div>

        {/* Hotkey badge */}
        <div
          className="flex-shrink-0 px-2 py-1 rounded-md text-xs font-mono"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 10
          }}
        >
          ⌃⌥Space
        </div>
      </div>
    </div>
  )
}

function MicIcon({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={color} opacity={isActive ? 1 : 0.7} />
      <path
        d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={isActive ? 1 : 0.7}
      />
      <line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={isActive ? 1 : 0.7} />
      <line x1="9" y1="21" x2="15" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={isActive ? 1 : 0.7} />
    </svg>
  )
}

function ProcessingSpinner({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '12px 12px' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#ff3b30" strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="13" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="#ff3b30" />
    </svg>
  )
}
