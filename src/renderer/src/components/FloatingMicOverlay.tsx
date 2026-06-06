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

  const size = isIdle ? 6 : 44

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
          pointerEvents: 'none',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
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
              border: `2px solid ${config.color}`,
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
                border: `2px solid ${config.color}`,
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
                border: `2px solid ${config.color}`,
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
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}>
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
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ shapeRendering: 'geometricPrecision', transform: 'translateZ(0)' }}>
      <rect x="11" y="3" width="8" height="14" rx="4" fill={color} opacity={isActive ? 1 : 0.7} />
      <path
        d="M6 15c0 5 4 9 9 9s9-4 9-9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={isActive ? 1 : 0.7}
      />
      <line x1="15" y1="24" x2="15" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={isActive ? 1 : 0.7} />
      <line x1="9" y1="28" x2="21" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={isActive ? 1 : 0.7} />
    </svg>
  )
}

function ProcessingSpinner({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ shapeRendering: 'geometricPrecision', transform: 'translateZ(0)' }}>
      <circle cx="15" cy="15" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
      <path
        d="M15 5a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: 'spin 0.8s linear infinite', transformOrigin: '15px 15px' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

// Success checkmark icon (30x30)
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ shapeRendering: 'geometricPrecision', transform: 'translateZ(0)' }}>
      <polyline points="7 15 12 20 23 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Error warning icon (30x30)
function ErrorIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ shapeRendering: 'geometricPrecision', transform: 'translateZ(0)' }}>
      <circle cx="15" cy="15" r="10" stroke="#ff3b30" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15" y2="17" stroke="#ff3b30" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="15" cy="21" r="1.5" fill="#ff3b30" />
    </svg>
  )
}

