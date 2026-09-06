'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  createAnalyserNode,
  decodeFromSource,
  ensureAudioContext,
  prepareHtmlAudioElement,
  unlockAudioContext,
} from '@/lib/audio/web-audio'
import { guessAudioMimeType, playbackTimeFromClock } from '@/lib/audio/waveform'

/**
 * iOS-sichere Wiedergabe mit echter Waveform.
 *
 * Bevorzugt Web Audio (`AudioBufferSourceNode` → Analyser → Destination):
 * das umgeht den Safari-Bug, bei dem `createMediaElementSource` das
 * `<audio>`-Element stumm auf den Graphen umleitet.
 *
 * Fallback: natives `<audio>` *ohne* MediaElementSource, damit Ton auf
 * iOS hörbar bleibt, auch wenn `decodeAudioData` scheitert.
 */

export type PlaybackError = null | 'format' | 'load'
export type PlaybackEngine = 'webaudio' | 'html' | 'none'

const CLOCK_UPDATE_MS = 80

export interface UseAudioPlaybackResult {
  engine: PlaybackEngine
  error: PlaybackError
  isPlaying: boolean
  isBuffering: boolean
  currentTime: number
  duration: number
  analyserRef: RefObject<AnalyserNode | null>
  htmlAudioRef: RefObject<HTMLAudioElement | null>
  play: () => Promise<void>
  pause: () => void
  seek: (seconds: number) => void
}

export function useAudioPlayback(
  src: string | null,
  rate: number,
  blob?: Blob | null
): UseAudioPlaybackResult {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const destinationConnectedRef = useRef(false)
  const offsetRef = useRef(0)
  const startedAtRef = useRef(0)
  const rateRef = useRef(rate)
  const engineRef = useRef<PlaybackEngine>('none')
  const clockTimerRef = useRef<number | null>(null)
  const playGenerationRef = useRef(0)

  const [engine, setEngine] = useState<PlaybackEngine>('none')
  const [error, setError] = useState<PlaybackError>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  rateRef.current = rate
  engineRef.current = engine

  const stopClock = useCallback(() => {
    if (clockTimerRef.current !== null) {
      window.clearInterval(clockTimerRef.current)
      clockTimerRef.current = null
    }
  }, [])

  const readWebAudioTime = useCallback((): number => {
    const context = ensureAudioContext()
    const buffer = bufferRef.current
    if (!context || !buffer) return offsetRef.current
    return playbackTimeFromClock(
      context.currentTime,
      startedAtRef.current,
      offsetRef.current,
      rateRef.current,
      buffer.duration
    )
  }, [])

  const stopSource = useCallback(
    (rememberOffset: boolean) => {
      if (rememberOffset && engineRef.current === 'webaudio' && sourceRef.current) {
        offsetRef.current = readWebAudioTime()
      }
      const source = sourceRef.current
      sourceRef.current = null
      if (source) {
        source.onended = null
        try {
          source.stop()
        } catch {
          // Bereits gestoppt.
        }
        try {
          source.disconnect()
        } catch {
          // Bereits getrennt.
        }
      }
    },
    [readWebAudioTime]
  )

  const startClock = useCallback(() => {
    stopClock()
    clockTimerRef.current = window.setInterval(() => {
      if (engineRef.current === 'webaudio') {
        setCurrentTime(readWebAudioTime())
        return
      }
      const audio = htmlAudioRef.current
      if (audio) setCurrentTime(audio.currentTime)
    }, CLOCK_UPDATE_MS)
  }, [readWebAudioTime, stopClock])

  const ensureAnalyser = useCallback((context: AudioContext): AnalyserNode => {
    if (!analyserRef.current || analyserRef.current.context !== context) {
      analyserRef.current = createAnalyserNode(context)
      destinationConnectedRef.current = false
    }
    if (!destinationConnectedRef.current) {
      analyserRef.current.connect(context.destination)
      destinationConnectedRef.current = true
    }
    return analyserRef.current
  }, [])

  const startBufferSource = useCallback(
    (fromSeconds: number) => {
      const context = ensureAudioContext()
      const buffer = bufferRef.current
      if (!context || !buffer) return

      stopSource(false)
      const analyser = ensureAnalyser(context)
      const source = context.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = rateRef.current
      source.connect(analyser)

      const durationSeconds = buffer.duration
      const offset = Math.min(Math.max(0, fromSeconds), Math.max(0, durationSeconds - 0.01))
      offsetRef.current = offset
      startedAtRef.current = context.currentTime

      const generation = playGenerationRef.current
      source.onended = () => {
        if (playGenerationRef.current !== generation) return
        if (sourceRef.current !== source) return
        sourceRef.current = null
        stopClock()
        offsetRef.current = 0
        setCurrentTime(0)
        setIsPlaying(false)
      }

      source.start(0, offset)
      sourceRef.current = source
      setCurrentTime(offset)
      setIsPlaying(true)
      startClock()
    },
    [ensureAnalyser, startClock, stopClock, stopSource]
  )

  useEffect(() => {
    setIsPlaying(false)
    setIsBuffering(Boolean(src))
    setCurrentTime(0)
    setDuration(0)
    setError(null)
    setEngine('none')
    engineRef.current = 'none'
    bufferRef.current = null
    offsetRef.current = 0
    stopSource(false)
    stopClock()
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {
        // Bereits getrennt.
      }
    }
    analyserRef.current = null
    destinationConnectedRef.current = false

    if (!src) {
      setIsBuffering(false)
      return
    }

    const mime = guessAudioMimeType(src)
    const probe = typeof Audio !== 'undefined' ? new Audio() : null
    const formatBlocked = Boolean(mime && probe && probe.canPlayType(mime) === '')

    let cancelled = false

    void (async () => {
      try {
        const context = ensureAudioContext()
        if (context) {
          const decoded = await decodeFromSource(context, src, blob)
          if (cancelled) return
          bufferRef.current = decoded
          setDuration(decoded.duration)
          setEngine('webaudio')
          engineRef.current = 'webaudio'
          setIsBuffering(false)
          return
        }
      } catch (err) {
        console.error('Web-Audio-Dekodierung fehlgeschlagen, Fallback auf HTML-Audio:', err)
      }

      if (cancelled) return

      if (formatBlocked) {
        console.error('Audioformat wird vom Browser nicht unterstützt:', { src, mime })
        setError('format')
        setEngine('none')
        engineRef.current = 'none'
        setIsBuffering(false)
        return
      }

      setEngine('html')
      engineRef.current = 'html'
      setIsBuffering(false)
    })()

    return () => {
      cancelled = true
      playGenerationRef.current += 1
      stopSource(false)
      stopClock()
    }
  }, [src, blob, stopClock, stopSource])

  useEffect(() => {
    if (engine !== 'html') return
    const audio = htmlAudioRef.current
    if (!audio || !src) return

    prepareHtmlAudioElement(audio, src)
    audio.playbackRate = rateRef.current

    const handleLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const handleDurationHack = () => {
      if (audio.duration === Infinity || Number.isNaN(audio.duration)) {
        const forceDuration = () => {
          audio.removeEventListener('timeupdate', forceDuration)
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
          audio.currentTime = 0
        }
        audio.addEventListener('timeupdate', forceDuration)
        try {
          audio.currentTime = 1e101
        } catch {
          setDuration(0)
        }
        return
      }
      setDuration(audio.duration)
    }
    const handlePlay = () => {
      setIsPlaying(true)
      setIsBuffering(false)
      setError(null)
      startClock()
    }
    const handlePause = () => {
      setIsPlaying(false)
      setIsBuffering(false)
      stopClock()
      setCurrentTime(audio.currentTime)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      stopClock()
      setCurrentTime(0)
    }
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)
    const handleError = () => {
      setIsBuffering(false)
      setError('load')
    }

    audio.addEventListener('loadedmetadata', handleDurationHack)
    audio.addEventListener('durationchange', handleLoaded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleDurationHack)
      audio.removeEventListener('durationchange', handleLoaded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [engine, src, startClock, stopClock])

  const previousRateRef = useRef(rate)

  useEffect(() => {
    if (engine === 'html' && htmlAudioRef.current) {
      htmlAudioRef.current.playbackRate = rate
    }

    const rateChanged = previousRateRef.current !== rate
    previousRateRef.current = rate
    if (rateChanged && engine === 'webaudio' && sourceRef.current) {
      startBufferSource(readWebAudioTime())
    }
  }, [engine, rate, readWebAudioTime, startBufferSource])

  const play = useCallback(async () => {
    if (!src || error === 'format') return

    // Context noch in der Geste anfassen, bevor irgendetwas awaited wird.
    const context = ensureAudioContext()
    void context?.resume()

    if (engineRef.current === 'webaudio' && bufferRef.current) {
      setIsBuffering(true)
      await unlockAudioContext()
      startBufferSource(offsetRef.current)
      setIsBuffering(false)
      return
    }

    const audio = htmlAudioRef.current
    if (engineRef.current === 'html' && audio) {
      setIsBuffering(true)
      audio.playbackRate = rateRef.current
      try {
        await audio.play()
      } catch (err) {
        console.error('Wiedergabe nicht möglich:', err)
        setIsBuffering(false)
        setError('load')
      }
      return
    }

    setIsBuffering(true)
    try {
      await unlockAudioContext()
      const running = ensureAudioContext()
      if (running && !bufferRef.current) {
        const decoded = await decodeFromSource(running, src, blob)
        bufferRef.current = decoded
        setDuration(decoded.duration)
        setEngine('webaudio')
        engineRef.current = 'webaudio'
      }
      if (bufferRef.current) {
        startBufferSource(offsetRef.current)
        setIsBuffering(false)
        return
      }
      const fallback = htmlAudioRef.current
      if (fallback) {
        await fallback.play()
        return
      }
      setError('load')
    } catch (err) {
      console.error('Wiedergabe nicht möglich:', err)
      setError('load')
    } finally {
      setIsBuffering(false)
    }
  }, [blob, error, src, startBufferSource])

  const pause = useCallback(() => {
    if (engineRef.current === 'webaudio') {
      stopSource(true)
      stopClock()
      setCurrentTime(offsetRef.current)
      setIsPlaying(false)
      return
    }
    htmlAudioRef.current?.pause()
  }, [stopClock, stopSource])

  const seek = useCallback(
    (seconds: number) => {
      const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
      if (engineRef.current === 'webaudio') {
        const max = bufferRef.current?.duration ?? duration
        const next = Math.min(safe, max)
        offsetRef.current = next
        setCurrentTime(next)
        if (isPlaying) startBufferSource(next)
        return
      }
      const audio = htmlAudioRef.current
      if (audio && duration > 0) {
        audio.currentTime = Math.min(safe, duration)
        setCurrentTime(audio.currentTime)
      }
    },
    [duration, isPlaying, startBufferSource]
  )

  return {
    engine,
    error,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    analyserRef,
    htmlAudioRef,
    play,
    pause,
    seek,
  }
}
