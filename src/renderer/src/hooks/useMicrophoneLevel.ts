import { useEffect, useRef, useState } from 'react'

export function useMicrophoneLevel(isActive: boolean): number {
  const [level, setLevel] = useState(0)
  const animFrameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isActive) {
      setLevel(0)
      return
    }

    let cancelled = false

    async function setup() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        const context = new AudioContext()
        contextRef.current = context
        const analyser = context.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser

        const source = context.createMediaStreamSource(stream)
        source.connect(analyser)
        sourceRef.current = source

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const tick = () => {
          if (cancelled) return
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          setLevel(Math.min(100, (avg / 128) * 100))
          animFrameRef.current = requestAnimationFrame(tick)
        }

        animFrameRef.current = requestAnimationFrame(tick)
      } catch {
        setLevel(0)
      }
    }

    setup()

    return () => {
      cancelled = true
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      sourceRef.current?.disconnect()
      contextRef.current?.close()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      setLevel(0)
    }
  }, [isActive])

  return level
}
