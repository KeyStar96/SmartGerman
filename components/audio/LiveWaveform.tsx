'use client'

import {
  WAVEFORM_BAR_COUNT,
  barHeightPercent,
  formatDuration,
} from '@/lib/audio/waveform'

/**
 * Tonspur der laufenden Aufnahme.
 *
 * Bewusst als Balken aus `div`s statt Canvas: skaliert auf Retina-Displays
 * ohne Zusatzlogik, respektiert die Farbwahl des Themes und lässt sich mit
 * `prefers-reduced-motion` ruhigstellen.
 */
export default function LiveWaveform({
  levels,
  isActive,
  elapsedSeconds,
  ariaLabel,
}: {
  levels: readonly number[]
  isActive: boolean
  elapsedSeconds: number
  ariaLabel: string
}) {
  const placeholders = Math.max(0, WAVEFORM_BAR_COUNT - levels.length)

  return (
    <div className="w-full">
      <div
        className="flex h-24 items-center justify-start gap-[3px] rounded-2xl bg-slate-100 px-4 dark:bg-slate-800"
        role="img"
        aria-label={ariaLabel}
      >
        {levels.map((level, index) => (
          <div
            key={index}
            className={`w-full max-w-[8px] flex-1 rounded-full transition-[height] duration-100 ${
              isActive ? 'bg-[#FF5C00]' : 'bg-slate-400 dark:bg-slate-500'
            }`}
            style={{ height: `${barHeightPercent(level)}%` }}
          />
        ))}
        {Array.from({ length: placeholders }, (_, index) => (
          <div
            key={`placeholder-${index}`}
            className="w-full max-w-[8px] flex-1 rounded-full bg-slate-200 dark:bg-slate-700"
            style={{ height: '6%' }}
          />
        ))}
      </div>

      <p className="mt-2 text-center text-lg font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {formatDuration(elapsedSeconds)}
      </p>
    </div>
  )
}
