'use client'

import { useRef, type RefObject } from 'react'
import FluidWaveform from '@/components/audio/FluidWaveform'
import { analyseFrame, formatDuration, levelFromTimeDomain } from '@/lib/audio/waveform'

/**
 * Siri-artige, fließende Tonspur der laufenden Aufnahme.
 *
 * Reine Zuleitung der echten Mikrofon-Lautstärke an die wiederverwendbare
 * `FluidWaveform`: Pro Frame wird der aktuelle Pegel direkt aus dem
 * `AnalyserNode` (Web Audio API, aus `useAudioRecorder`) gelesen. Ohne
 * `analyserRef` (z.B. Browser ohne AudioContext-Unterstützung) fällt die
 * Komponente auf den zuletzt bekannten Wert aus `levels` zurück, damit die
 * Aufnahme trotzdem sichtbar begleitet wird.
 */
export default function LiveWaveform({
  levels,
  isActive,
  elapsedSeconds,
  ariaLabel,
  analyserRef,
}: {
  levels: readonly number[]
  isActive: boolean
  elapsedSeconds: number
  ariaLabel: string
  /** Live-`AnalyserNode` der laufenden Aufnahme, siehe `useAudioRecorder`. */
  analyserRef?: RefObject<AnalyserNode | null>
}) {
  const levelsRef = useRef<readonly number[]>(levels)
  levelsRef.current = levels
  const timeBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const freqBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const lastToneRef = useRef(0.5)

  const readAnalyser = (): { volume: number; tone: number } | null => {
    const analyser = analyserRef?.current
    if (!analyser) return null
    if (!timeBufferRef.current || timeBufferRef.current.length !== analyser.fftSize) {
      timeBufferRef.current = new Uint8Array(analyser.fftSize)
    }
    if (!freqBufferRef.current || freqBufferRef.current.length !== analyser.frequencyBinCount) {
      freqBufferRef.current = new Uint8Array(analyser.frequencyBinCount)
    }
    return analyseFrame(analyser, timeBufferRef.current, freqBufferRef.current)
  }

  /** Aktueller Lautstärke-Pegel (0–1), direkt vom AnalyserNode oder als Fallback aus `levels`. */
  const getVolume = (): number => {
    const frame = readAnalyser()
    if (frame) {
      lastToneRef.current = frame.tone
      return frame.volume
    }
    const fallback = levelsRef.current
    return fallback.length > 0 ? (fallback[fallback.length - 1] ?? 0) : 0
  }

  const getTone = (): number => {
    const frame = readAnalyser()
    if (frame) {
      lastToneRef.current = frame.tone
      return frame.tone
    }
    return lastToneRef.current
  }

  return (
    <div className="w-full">
      <div
        role="img"
        aria-label={ariaLabel}
        className="h-24 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-orange-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      >
        <FluidWaveform getVolume={getVolume} getTone={getTone} isActive={isActive} />
      </div>

      <p className="mt-2 text-center text-lg font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {formatDuration(elapsedSeconds)}
      </p>
    </div>
  )
}
