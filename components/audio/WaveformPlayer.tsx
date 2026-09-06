'use client'

import { useCallback, useState, type KeyboardEvent } from 'react'
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import FluidWaveform from '@/components/audio/FluidWaveform'
import { useAudioPlayback } from '@/lib/audio/useAudioPlayback'
import { formatDuration, playbackProgress, seekTargetSeconds } from '@/lib/audio/waveform'
import {
  createPronunciationTranslator,
  type PronunciationTranslator,
} from '@/lib/pronunciation-i18n'

/** Tempo-Stufen: langsamer zum Nachsprechen, schneller zum Überfliegen. */
const SPEEDS = [1, 0.75, 1.25] as const

/** Sprung pro Pfeiltaste – bewusst grob, damit Nachjustieren leicht bleibt. */
const KEYBOARD_SEEK_SECONDS = 5

/** Greift nur, wenn kein Übersetzer übergeben wird (z.B. in der Lehrer-Ansicht). */
const defaultTranslator = createPronunciationTranslator({})

export default function WaveformPlayer({
  src,
  blob,
  t,
  label,
  compact = false,
}: {
  src: string | null
  /** Rohdaten der eigenen Aufnahme – auf iOS zuverlässiger zu dekodieren als nur die Blob-URL. */
  blob?: Blob | null
  /** Übersetzer aus `lib/pronunciation-i18n.ts`. */
  t?: PronunciationTranslator
  label?: string
  compact?: boolean
}) {
  const translate: PronunciationTranslator = t ?? defaultTranslator
  const [speedIndex, setSpeedIndex] = useState(0)
  const speed = SPEEDS[speedIndex] ?? 1

  const playback = useAudioPlayback(src, speed, blob)

  const getVolume = useCallback((): number => {
    if (!playback.isPlaying) return 0
    return playback.getVolume()
  }, [playback])

  const getTone = useCallback((): number => playback.getTone(), [playback])

  const togglePlayback = useCallback(() => {
    if (playback.error === 'format') return
    if (playback.isPlaying) {
      playback.pause()
      return
    }
    void playback.play()
  }, [playback])

  const handleRetry = useCallback(() => {
    void playback.play()
  }, [playback])

  const handleSeek = useCallback(
    (clientX: number, track: HTMLDivElement) => {
      if (playback.duration <= 0) return
      const rect = track.getBoundingClientRect()
      playback.seek(seekTargetSeconds(clientX - rect.left, rect.width, playback.duration))
    },
    [playback]
  )

  const handleSeekByKeyboard = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (playback.duration <= 0) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        playback.seek(Math.max(0, playback.currentTime - KEYBOARD_SEEK_SECONDS))
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        playback.seek(Math.min(playback.duration, playback.currentTime + KEYBOARD_SEEK_SECONDS))
      } else if (event.key === 'Home') {
        event.preventDefault()
        playback.seek(0)
      }
    },
    [playback]
  )

  if (!src) return null

  const progress = playbackProgress(playback.currentTime, playback.duration)
  const playbackBlocked = playback.error !== null

  return (
    <div className="w-full">
      {label && (
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlayback}
          disabled={playbackBlocked}
          aria-label={playback.isPlaying ? translate('pause_aria') : translate('play_aria')}
          aria-busy={playback.isBuffering}
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#FF5C00] text-white shadow-md transition-colors hover:bg-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${
            compact ? 'h-12 w-12' : 'h-16 w-16'
          }`}
        >
          {playback.isBuffering ? (
            <Loader2 size={compact ? 22 : 30} className="animate-spin" aria-hidden="true" />
          ) : playback.isPlaying ? (
            <Pause size={compact ? 22 : 30} aria-hidden="true" />
          ) : (
            <Play size={compact ? 22 : 30} aria-hidden="true" />
          )}
        </button>

        <div
          role="slider"
          tabIndex={0}
          aria-label={translate('waveform_aria')}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.round(playback.duration))}
          aria-valuenow={Math.round(playback.currentTime)}
          aria-valuetext={`${formatDuration(playback.currentTime)} / ${formatDuration(playback.duration)}`}
          onClick={(event) => handleSeek(event.clientX, event.currentTarget)}
          onKeyDown={handleSeekByKeyboard}
          className={`relative flex-1 cursor-pointer overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:bg-slate-800 ${
            compact ? 'h-12' : 'h-16'
          }`}
        >
          <FluidWaveform getVolume={getVolume} getTone={getTone} isActive={playback.isPlaying} />

          <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-300/70 dark:bg-slate-600/70">
            <div
              className="h-full bg-[#FF5C00] transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-base font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            {formatDuration(playback.currentTime)} / {formatDuration(playback.duration)}
          </span>
          <button
            type="button"
            onClick={() => setSpeedIndex((index) => (index + 1) % SPEEDS.length)}
            aria-label={translate('speed_aria', { speed: `${speed}×` })}
            className="min-h-12 rounded-xl bg-slate-100 px-4 text-base font-bold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {translate('speed_label', { speed: `${speed}×` })}
          </button>
        </div>
      </div>

      {playback.isBuffering && !playbackBlocked && (
        <p className="mt-2 flex items-center gap-2 text-base text-slate-600 dark:text-slate-400" role="status">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          {translate('audio_loading')}
        </p>
      )}

      {playbackBlocked && (
        <div
          role="alert"
          className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20"
        >
          <p className="text-base text-amber-900 dark:text-amber-200">
            {playback.error === 'format' ? translate('audio_format_unsupported') : translate('audio_unavailable')}
          </p>
          {playback.error === 'load' && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-600 px-5 text-base font-bold text-white shadow-sm transition-colors hover:bg-amber-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              <RotateCcw size={18} aria-hidden="true" />
              {translate('audio_retry')}
            </button>
          )}
        </div>
      )}

      <audio ref={playback.htmlAudioRef} playsInline preload="auto" className="hidden" />
    </div>
  )
}
