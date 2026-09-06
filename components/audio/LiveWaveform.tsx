'use client'

import { useRef, type RefObject } from 'react'
import FluidWaveform from '@/components/audio/FluidWaveform'
import { useAnalyserFrame } from '@/lib/audio/useAnalyserFrame'
import { formatDuration } from '@/lib/audio/waveform'

/**
 * Siri-artige, fließende Tonspur der laufenden Aufnahme.
 *
 * Liest Lautstärke und Stimmlage direkt aus dem Mikrofon-`AnalyserNode`.
 * Ohne Analyser fällt die Amplitude auf den letzten `levels`-Wert zurück.
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
  analyserRef?: RefObject<AnalyserNode | null>
}) {
  const levelsRef = useRef<readonly number[]>(levels)
  levelsRef.current = levels
  const emptyAnalyserRef = useRef<AnalyserNode | null>(null)
  const frame = useAnalyserFrame(analyserRef ?? emptyAnalyserRef)

  const getVolume = (): number => {
    if (analyserRef?.current) return frame.getVolume()
    const fallback = levelsRef.current
    return fallback.length > 0 ? (fallback[fallback.length - 1] ?? 0) : 0
  }

  return (
    <div className="w-full">
      <div
        role="img"
        aria-label={ariaLabel}
        className="h-24 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-orange-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      >
        <FluidWaveform getVolume={getVolume} getTone={frame.getTone} isActive={isActive} />
      </div>

      <p className="mt-2 text-center text-lg font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {formatDuration(elapsedSeconds)}
      </p>
    </div>
  )
}
