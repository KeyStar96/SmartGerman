'use client'

import { useCallback, useRef, type RefObject } from 'react'
import { analyseFrame } from '@/lib/audio/waveform'

/**
 * Liest Lautstärke, Stimmlage und Zeitbereich aus einem `AnalyserNode`.
 * Puffer werden wiederverwendet, damit die rAF-Schleife keinen Garbage erzeugt.
 */
export function useAnalyserFrame(analyserRef: RefObject<AnalyserNode | null>): {
  getVolume: () => number
  getTone: () => number
  getSamples: () => Uint8Array<ArrayBuffer> | null
} {
  const timeBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const freqBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const lastToneRef = useRef(0.5)

  const read = useCallback((): { volume: number; tone: number } | null => {
    const analyser = analyserRef.current
    if (!analyser) return null
    if (!timeBufferRef.current || timeBufferRef.current.length !== analyser.fftSize) {
      timeBufferRef.current = new Uint8Array(analyser.fftSize)
    }
    if (!freqBufferRef.current || freqBufferRef.current.length !== analyser.frequencyBinCount) {
      freqBufferRef.current = new Uint8Array(analyser.frequencyBinCount)
    }
    const frame = analyseFrame(analyser, timeBufferRef.current, freqBufferRef.current)
    lastToneRef.current = frame.tone
    return frame
  }, [analyserRef])

  const getVolume = useCallback((): number => read()?.volume ?? 0, [read])

  const getTone = useCallback((): number => {
    const frame = read()
    return frame ? frame.tone : lastToneRef.current
  }, [read])

  const getSamples = useCallback((): Uint8Array<ArrayBuffer> | null => {
    if (!read()) return null
    return timeBufferRef.current
  }, [read])

  return { getVolume, getTone, getSamples }
}
