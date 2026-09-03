'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Pause, Play } from 'lucide-react'
import FluidWaveform from '@/components/audio/FluidWaveform'
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
  /** Frame-Zähler für die Sinus-Simulation der Wiedergabe-Welle, siehe `getVolume`. */
  const simPhaseRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(0)
  const [hasError, setHasError] = useState(false)

  const translate: PronunciationTranslator = t ?? defaultTranslator

  const speed = SPEEDS[speedIndex] ?? 1

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  /**
   * Simulierter Lautstärke-Pegel während der Wiedergabe (0..1).
   *
   * Bewusst KEIN echter `AnalyserNode` am `<audio>`-Element: Das würde die
   * Wiedergabe über `createMediaElementSource()` in den Web-Audio-Graphen
   * umleiten (Stummschaltungsrisiko bei fehlendem `resume()`/fehlender
   * Verbindung zu `destination`, nur eine Quelle pro Element über alle
   * Re-Renders hinweg möglich, CORS-Abhängigkeit vom Storage-Bucket für
   * echte Frequenzdaten). Für die Kernfunktion "Aufnahme anhören" ist das
   * zu riskant – zwei sanft verstimmte, überlagerte Sinuswellen ergeben ein
   * organisches, nie exakt periodisches Wellenbild, ganz ohne dieses Risiko.
   */
  const getVolume = useCallback((): number => {
    if (!isPlaying) return 0
    simPhaseRef.current += 1
    const frame = simPhaseRef.current
    const wave =
      Math.sin(frame * 0.05) * 0.5 + Math.sin(frame * 0.087 + 1.3) * 0.35 + Math.sin(frame * 0.021) * 0.15
    return Math.min(1, Math.max(0, 0.55 + wave * 0.45))
  }, [isPlaying])

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
          className={`relative flex-1 cursor-pointer overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:bg-slate-800 ${
            compact ? 'h-12' : 'h-16'
          }`}
        >
          <FluidWaveform getVolume={getVolume} isActive={isPlaying} />

          {/* Dezente Fortschritts-Leiste unter der Welle – ersetzt die frühere Balken-Einfärbung. */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-300/70 dark:bg-slate-600/70">
            <div
              className="h-full bg-[#FF5C00] transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
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
