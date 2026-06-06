import { create } from 'zustand'
import type { RecordingState } from '../../../shared/types'

interface RecordingStore {
  recordingState: RecordingState
  audioLevel: number
  recordingDurationMs: number
  lastTranscript: string
  lastError: string | null

  setRecordingState: (state: RecordingState) => void
  setAudioLevel: (level: number) => void
  setRecordingDuration: (ms: number) => void
  setLastTranscript: (text: string) => void
  setLastError: (error: string | null) => void
  reset: () => void
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  recordingState: 'idle',
  audioLevel: 0,
  recordingDurationMs: 0,
  lastTranscript: '',
  lastError: null,

  setRecordingState: (state) => set({ recordingState: state }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  setRecordingDuration: (ms) => set({ recordingDurationMs: ms }),
  setLastTranscript: (text) => set({ lastTranscript: text }),
  setLastError: (error) => set({ lastError: error }),
  reset: () =>
    set({
      recordingState: 'idle',
      audioLevel: 0,
      recordingDurationMs: 0,
      lastError: null
    })
}))
