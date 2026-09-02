'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Pause, Play } from 'lucide-react'
import {
  WAVEFORM_BAR_COUNT,
  barHeightPercent,
  extractPeaks,
  formatDuration,
  normalizePeaks,
  playbackProgress,
  seekTargetSeconds,
} from '@/lib/audio/waveform'
import {
  createPronunciationTranslator,
  type PronunciationTranslator,
} from '@/lib/pronunciation-i18n'

/** Tempo-Stufen: langsamer zum Nachsprechen, schneller zum Überfliegen. */
const SPEEDS = [1, 0.75, 1.25] as const

/** Flache Balken, solange die echten Spitzenwerte noch nicht vorliegen. */
const FLAT_PEAKS: readonly number[] = Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.18)

/** Sprung pro Pfeiltaste – bewusst grob, damit Nachjustieren leicht bleibt. */
const KEYBOARD_SEEK_SECONDS = 5

/** Greift nur, wenn kein Übersetzer übergeben wird (z.B. in der Lehrer-Ansicht). */
const defaultTranslator = createPronunciationTranslator({})

interface WindowWithLegacyAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext
}

/**
 * Liest die Spitzenwerte einer Audio-Datei für die statische Tonspur.
 * Schlägt das fehl (CORS, exotisches Format), bleibt die Wiedergabe nutzbar
 * und es werden nur die flachen Platzhalter-Balken gezeigt.
 */
async function loadPeaks(src: string, signal: AbortSignal): Promise<number[] | null> {
  try {
    const response = await fetch(src, { signal })
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const legacy = (window as WindowWithLegacyAudioContext).webkitAudioContext
    const Ctor = window.AudioContext ?? legacy
    if (!Ctor) return null

    const context = new Ctor()
    try {
      const decoded = await context.decodeAudioData(buffer)
      return normalizePeaks(extractPeaks(decoded.getChannelData(0)))
    } finally {
      void context.close().catch(() => undefined)
    }
  } catch (err) {
    if (signal.aborted) return null
    console.warn('Tonspur konnte nicht analysiert werden:', err)
    return null
  }
}

export default function WaveformPlayer({
  src,
  t,
  label,
  compact = false,
}: {
  src: string | null
  /** Übersetzer aus `lib/pronunciation-i18n.ts`. */
  t?: PronunciationTranslator
  label?: string
  compact?: boolean
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const [peaks, setPeaks] = useState<readonly number[]>(FLAT_PEAKS)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(0)
  const [hasError, setHasError] = useState(false)

  const translate: PronunciationTranslator = t ?? defaultTranslator

  useEffect(() => {
    if (!src) return
    const controller = new AbortController()

    void loadPeaks(src, controller.signal).then((result) => {
      if (!controller.signal.aborted && result) setPeaks(result)
    })

    return () => controller.abort()
  }, [src])

  const speed = SPEEDS[speedIndex] ?? 1

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      return
    }

    audio.playbackRate = speed
    void audio.play().catch((err) => {
      console.error('Wiedergabe nicht möglich:', err)
      setHasError(true)
    })
  }, [isPlaying, speed])

  const handleSeek = useCallback(
    (clientX: number) => {
      const audio = audioRef.current
      const track = trackRef.current
      if (!audio || !track || duration <= 0) return

      const rect = track.getBoundingClientRect()
      audio.currentTime = seekTargetSeconds(clientX - rect.left, rect.width, duration)
    },
    [duration]
  )

  const handleSeekByKeyboard = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      if (!audio || duration <= 0) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        audio.currentTime = Math.max(0, audio.currentTime - KEYBOARD_SEEK_SECONDS)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        audio.currentTime = Math.min(duration, audio.currentTime + KEYBOARD_SEEK_SECONDS)
      } else if (event.key === 'Home') {
        event.preventDefault()
        audio.currentTime = 0
      }
    },
    [duration]
  )

  if (!src) return null

  const progress = playbackProgress(currentTime, duration)
  const playedBars = Math.round(progress * peaks.length)

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
          disabled={hasError}
          aria-label={isPlaying ? translate('pause_aria') : translate('play_aria')}
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#FF5C00] text-white shadow-md transition-colors hover:bg-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${
            compact ? 'h-12 w-12' : 'h-16 w-16'
          }`}
        >
          {isPlaying ? (
            <Pause size={compact ? 22 : 30} aria-hidden="true" />
          ) : (
            <Play size={compact ? 22 : 30} aria-hidden="true" />
          )}
        </button>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={translate('waveform_aria')}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, Math.round(duration))}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatDuration(currentTime)} / ${formatDuration(duration)}`}
          onClick={(event) => handleSeek(event.clientX)}
          onKeyDown={handleSeekByKeyboard}
          className={`flex flex-1 cursor-pointer items-center justify-start gap-[2px] rounded-2xl bg-slate-100 px-3 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:bg-slate-800 ${
            compact ? 'h-12' : 'h-16'
          }`}
        >
          {peaks.map((peak, index) => (
            <div
              key={index}
              aria-hidden="true"
              className={`w-full max-w-[7px] flex-1 rounded-full transition-colors ${
                index < playedBars ? 'bg-[#FF5C00]' : 'bg-slate-400 dark:bg-slate-500'
              }`}
              style={{ height: `${barHeightPercent(peak)}%` }}
            />
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-base font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            {formatDuration(currentTime)} / {formatDuration(duration)}
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

      {hasError && (
        <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
          {translate('audio_unavailable')}
        </p>
      )}

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onError={() => setHasError(true)}
        className="hidden"
      />
    </div>
  )
}
