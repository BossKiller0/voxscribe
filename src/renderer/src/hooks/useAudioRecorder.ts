import { useRef, useCallback, useEffect } from 'react'
import { useRecordingStore } from '../store/recordingStore'
import { useSettingsStore } from '../store/settingsStore'

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const { setRecordingState, setAudioLevel, setLastError, setLastTranscript } = useRecordingStore()
  const { settings } = useSettingsStore()

  const startRecording = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.microphoneDeviceId !== 'default'
            ? { exact: settings.microphoneDeviceId }
            : undefined,
          noiseSuppression: settings.noiseSuppressionEnabled,
          echoCancellation: settings.echoCancellationEnabled,
          sampleRate: 16000,
          channelCount: 1
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.start(100) // Collect chunks every 100ms
      setRecordingState('listening')
    } catch (err: any) {
      console.error('[useAudioRecorder] Failed to start:', err)
      setLastError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access.'
          : err.name === 'NotFoundError'
          ? 'No microphone found. Please connect a microphone.'
          : `Microphone error: ${err.message}`
      )
      setRecordingState('error')
    }
  }, [settings, setRecordingState, setLastError])

  const stopRecording = useCallback((): Promise<{ blob: Blob; format: string; durationMs: number } | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null)
        return
      }

      mediaRecorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })

        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        mediaRecorderRef.current = null
        chunksRef.current = []

        const format = mimeType.includes('mp3') ? 'mp3' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        resolve({ blob, format, durationMs })
      }

      mediaRecorder.stop()
    })
  }, [])

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = null
      try {
        mediaRecorder.stop()
      } catch (err) {
        console.warn('[useAudioRecorder] Error stopping media recorder during cancellation:', err)
      }
    }
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    console.log('[useAudioRecorder] Recording cancelled and references cleaned')
  }, [])

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return { startRecording, stopRecording, cancelRecording, cleanup }
}
