'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react'
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import FluidWaveform from '@/components/audio/FluidWaveform'
import {
  attachPlaybackAnalyser,
  readPlaybackAnalysis,
  resumePlaybackAnalyser,
} from '@/lib/audio/playback-analyser'
import { formatDuration, guessAudioMimeType, playbackProgress, seekTargetSeconds } from '@/lib/audio/waveform'
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

/**
 * `null`   → alles in Ordnung
 * `format` → der Browser kann dieses Format grundsätzlich nicht (z.B. webm auf iOS)
 * `load`   → Datei nicht ladbar/abspielbar (Netzwerk, 404, CORS-Blockade)
 */
type PlaybackError = null | 'format' | 'load'

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
  const lastToneRef = useRef(0.5)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(0)
  const [error, setError] = useState<PlaybackError>(null)

  const translate: PronunciationTranslator = t ?? defaultTranslator

  const speed = SPEEDS[speedIndex] ?? 1

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  /**
   * Bei jedem Quellenwechsel den Zustand zurücksetzen und – noch bevor der
   * Nutzer klickt – prüfen, ob der Browser das Format überhaupt abspielen kann.
   * So erscheint bei nicht unterstützten Formaten (z.B. webm auf Safari/iOS)
   * ein klarer Hinweis statt stummer Wiedergabe ohne Rückmeldung.
   */
  useEffect(() => {
    setIsPlaying(false)
    setIsBuffering(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)

    if (!src) return
    const audio = audioRef.current
    const mime = guessAudioMimeType(src)
    if (audio && mime && audio.canPlayType(mime) === '') {
      console.error('Audioformat wird vom Browser nicht unterstützt:', { src, mime })
      setError('format')
    }
  }, [src])

  /**
   * Echter Lautstärke-Pegel der laufenden Tonspur (0..1).
   * Liest `getByteTimeDomainData` aus dem an das `<audio>`-Element
   * angeschlossenen `AnalyserNode`. Bei Stille / Pause: 0.
   */
  const getVolume = useCallback((): number => {
    const audio = audioRef.current
    if (!audio || !isPlaying) return 0
    const frame = readPlaybackAnalysis(audio)
    lastToneRef.current = frame.tone
    return frame.volume
  }, [isPlaying])

  /** Spektraler Schwerpunkt (Stimmlage) derselben Tonspur. */
  const getTone = useCallback((): number => {
    const audio = audioRef.current
    if (!audio || !isPlaying) return lastToneRef.current
    const frame = readPlaybackAnalysis(audio)
    lastToneRef.current = frame.tone
    return frame.tone
  }, [isPlaying])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio || error === 'format') return

    if (isPlaying) {
      audio.pause()
      return
    }

    setIsBuffering(true)
    audio.playbackRate = speed
    attachPlaybackAnalyser(audio)
    void resumePlaybackAnalyser(audio)
    void audio.play().catch((err) => {
      console.error('Wiedergabe nicht möglich:', err)
      setIsBuffering(false)
      setError('load')
    })
  }, [error, isPlaying, speed])

  const handleRetry = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setError(null)
    setIsBuffering(true)
    // Erzwingt ein frisches Laden der Quelle (nach Netzwerk-/Timeout-Fehlern).
    audio.load()
    attachPlaybackAnalyser(audio)
    void resumePlaybackAnalyser(audio)
    void audio.play().catch((err) => {
      console.error('Erneute Wiedergabe nicht möglich:', err)
      setIsBuffering(false)
      setError('load')
    })
  }, [])

  /**
   * Manche per `MediaRecorder` erzeugten webm-Dateien liefern zunächst eine
   * unendliche Dauer (der Header trägt sie nicht). Das ist ein bekannter
   * Browser-Bug: einmal ans Ende springen erzwingt die echte Dauer.
   */
  const handleLoadedMetadata = useCallback((event: SyntheticEvent<HTMLAudioElement>) => {
    const audio = event.currentTarget
    if (audio.duration === Infinity || Number.isNaN(audio.duration)) {
      const forceDuration = () => {
        audio.removeEventListener('timeupdate', forceDuration)
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
        audio.currentTime = 0
      }
      audio.addEventListener('timeupdate', forceDuration)
      // Sehr großer Wert → Browser seekt ans reale Ende und kennt dann die Dauer.
      try {
        audio.currentTime = 1e101
      } catch {
        setDuration(0)
      }
      return
    }
    setDuration(audio.duration)
  }, [])

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
  const playbackBlocked = error !== null

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
          aria-label={isPlaying ? translate('pause_aria') : translate('play_aria')}
          aria-busy={isBuffering}
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#FF5C00] text-white shadow-md transition-colors hover:bg-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${
            compact ? 'h-12 w-12' : 'h-16 w-16'
          }`}
        >
          {isBuffering ? (
            <Loader2 size={compact ? 22 : 30} className="animate-spin" aria-hidden="true" />
          ) : isPlaying ? (
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
          <FluidWaveform getVolume={getVolume} getTone={getTone} isActive={isPlaying} />

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

      {isBuffering && !playbackBlocked && (
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
            {error === 'format' ? translate('audio_format_unsupported') : translate('audio_unavailable')}
          </p>
          {error === 'load' && (
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

      <audio
        ref={audioRef}
        src={src}
        crossOrigin={src.startsWith('http') ? 'anonymous' : undefined}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={(event) => {
          const value = event.currentTarget.duration
          if (Number.isFinite(value) && value > 0) setDuration(value)
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false)
          setError(null)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false)
          setIsBuffering(false)
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onError={() => {
          setIsBuffering(false)
          setError('load')
        }}
        className="hidden"
      />
    </div>
  )
}
