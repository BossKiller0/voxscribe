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
  const isIdle = recordingState === 'idle'
  const isProcessing = recordingState === 'processing'
  const isInserting = recordingState === 'inserting'
  const isError = recordingState === 'error'

  const size = isIdle ? 6 : 24

  // Listen for IPC events from main process
  useEffect(() => {
    const unsubShow = window.voxScribeAPI.onOverlayShow(() => setVisible(true))
    const unsubHide = window.voxScribeAPI.onOverlayHide(() => {
      setTimeout(() => setVisible(false), 350)
    })

    const unsubRecording = window.voxScribeAPI.onRecordingStateChange(async (state) => {
      if (state === 'listening') {
        setRecordingState('listening')
        await startRecording()
      }
    })

    const unsubStop = window.voxScribeAPI.onStopRecording(async () => {
      setRecordingState('processing')
      const result = await stopRecording()

      if (!result) {
        setRecordingState('idle')
        return
      }

      try {
        const arrayBuffer = await result.blob.arrayBuffer()
        const transcriptionResult = await window.voxScribeAPI.transcribeAudio(arrayBuffer, result.format)

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
        WebkitFontSmoothing: 'antialiased',
        pointerEvents: 'none'
      }}
    >
      {/* Circle / Dot Widget Container */}
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          pointerEvents: 'none'
        }}
      >
        {/* Idle Dot */}
        {isIdle && (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'rgba(124, 111, 247, 0.25)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Pulsing Background Circle for active states */}
        {!isIdle && (
          <div
            style={{
               position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: config.bg,
              border: `1.5px solid ${config.color}`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 8px ${config.color}25`,
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {/* Ripple rings pulsing outwards behind/around the circle */}
        {isListening && (
          <>
            <style>{`
              @keyframes ripple-pulse {
                0% {
                  transform: scale(1);
                  opacity: 0.5;
                }
                100% {
                  transform: scale(1.4);
                  opacity: 0;
                }
              }
            `}</style>
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1.5px solid ${config.color}`,
                animation: 'ripple-pulse 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite',
                pointerEvents: 'none',
                opacity: 0,
                zIndex: 1
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1.5px solid ${config.color}`,
                animation: 'ripple-pulse 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite',
                animationDelay: '0.6s',
                pointerEvents: 'none',
                opacity: 0,
                zIndex: 1
              }}
            />
          </>
        )}

        {/* Static Inner Icons in Foreground */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isListening && <MicIcon color={config.color} isActive={true} />}
          {isProcessing && <ProcessingSpinner color={config.color} />}
          {isInserting && <CheckIcon color={config.color} />}
          {isError && <ErrorIcon />}
        </div>
      </div>
    </div>
  )
}

function MicIcon({ color, isActive }: { color: string; isActive: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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

// Success checkmark icon (12x12)
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Error warning icon (12x12)
function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#ff3b30" strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="13" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="#ff3b30" />
    </svg>
  )
}

