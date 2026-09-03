'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { appendLevel, levelFromTimeDomain, WAVEFORM_BAR_COUNT } from '@/lib/audio/waveform'

/**
 * Gemeinsame Aufnahme-Logik für Schüler und Lehrkraft.
 *
 * Kapselt `getUserMedia`, `MediaRecorder` und den `AnalyserNode` für die
 * live mitlaufende Tonspur. Vorher lag diese Logik doppelt in
 * `AudioRecorder` und `PendingSubmissionCard`.
 */

export type RecorderStatus =
  /** Noch nichts aufgenommen. */
  | 'idle'
  /** Warten auf die Mikrofon-Freigabe des Browsers. */
  | 'requesting'
  | 'recording'
  /** Aufnahme liegt als Blob bereit. */
  | 'ready'
  /** Der Browser kann nicht aufnehmen (z.B. sehr alter iOS-Safari). */
  | 'unsupported'
  /** Der Nutzer hat den Mikrofon-Zugriff abgelehnt. */
  | 'denied'
  /** Technischer Fehler während der Aufnahme. */
  | 'failed'

export interface UseAudioRecorderResult {
  status: RecorderStatus
  /** Pegelwerte 0–1 für die laufende Tonspur. */
  levels: readonly number[]
  elapsedSeconds: number
  /** Object-URL der fertigen Aufnahme, für Wiedergabe im Browser. */
  audioUrl: string | null
  audioBlob: Blob | null
  isRecording: boolean
  hasRecording: boolean
  /**
   * Live-Zugriff auf den `AnalyserNode` der laufenden Aufnahme, für eigene
   * Visualisierungen (z.B. die Canvas-Siri-Wave in `LiveWaveform`).
   * `current` ist nur während der Aufnahme gesetzt und wird beim Stoppen
   * automatisch wieder auf `null` gesetzt (siehe `teardown`).
   */
  analyserRef: RefObject<AnalyserNode | null>
  start: () => Promise<void>
  stop: () => void
  /** Verwirft die Aufnahme und gibt den Object-URL frei. */
  reset: () => void
}

/** Reihenfolge nach Kompatibilität: Chrome/Firefox zuerst, dann Safari. */
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] as const

/** Abstand zwischen zwei Balken der laufenden Tonspur. */
const LEVEL_SAMPLE_INTERVAL_MS = 110

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const candidate of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return undefined
}

function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

interface WindowWithLegacyAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext
}

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const legacy = (window as WindowWithLegacyAudioContext).webkitAudioContext
  const Ctor = window.AudioContext ?? legacy
  return Ctor ? new Ctor() : null
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [levels, setLevels] = useState<readonly number[]>([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastSampleAtRef = useRef(0)
  const startedAtRef = useRef(0)
  const objectUrlRef = useRef<string | null>(null)

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  /** Gibt Mikrofon, AudioContext und die Animationsschleife frei. */
  const teardown = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    analyserRef.current = null

    if (audioContextRef.current) {
      // Der Close-Promise interessiert uns nicht; Fehler hier sind unkritisch.
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      teardown()
      releaseObjectUrl()
    },
    [releaseObjectUrl, teardown]
  )

  const start = useCallback(async () => {
    if (!isRecordingSupported()) {
      setStatus('unsupported')
      return
    }

    releaseObjectUrl()
    setAudioUrl(null)
    setAudioBlob(null)
    setLevels([])
    setElapsedSeconds(0)
    setStatus('requesting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      console.error('Mikrofon-Zugriff nicht möglich:', err)
      setStatus('denied')
      return
    }

    streamRef.current = stream

    try {
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setAudioBlob(blob)
        setAudioUrl(url)
        setStatus(blob.size > 0 ? 'ready' : 'failed')
        teardown()
      }

      recorder.onerror = () => {
        console.error('MediaRecorder hat die Aufnahme abgebrochen.')
        setStatus('failed')
        teardown()
      }

      // Die Tonspur ist reine Zugabe: schlägt der AudioContext fehl,
      // läuft die Aufnahme ohne Visualisierung weiter.
      const audioContext = createAudioContext()
      if (audioContext) {
        audioContextRef.current = audioContext
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 1024
        audioContext.createMediaStreamSource(stream).connect(analyser)
        analyserRef.current = analyser

        const buffer = new Uint8Array(analyser.fftSize)
        const tick = () => {
          const active = analyserRef.current
          if (!active) return

          const now = performance.now()
          setElapsedSeconds((now - startedAtRef.current) / 1000)

          if (now - lastSampleAtRef.current >= LEVEL_SAMPLE_INTERVAL_MS) {
            lastSampleAtRef.current = now
            active.getByteTimeDomainData(buffer)
            const level = levelFromTimeDomain(buffer)
            setLevels((previous) => appendLevel(previous, level, WAVEFORM_BAR_COUNT))
          }

          frameRef.current = requestAnimationFrame(tick)
        }

        startedAtRef.current = performance.now()
        lastSampleAtRef.current = 0
        frameRef.current = requestAnimationFrame(tick)
      } else {
        startedAtRef.current = performance.now()
      }

      recorder.start()
      setStatus('recording')
    } catch (err) {
      console.error('Aufnahme konnte nicht gestartet werden:', err)
      teardown()
      setStatus('failed')
    }
  }, [releaseObjectUrl, teardown])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      teardown()
    }
  }, [teardown])

  const reset = useCallback(() => {
    releaseObjectUrl()
    setAudioBlob(null)
    setAudioUrl(null)
    setLevels([])
    setElapsedSeconds(0)
    setStatus('idle')
  }, [releaseObjectUrl])

  return {
    status,
    levels,
    elapsedSeconds,
    audioUrl,
    audioBlob,
    isRecording: status === 'recording',
    hasRecording: status === 'ready' && audioBlob !== null,
    analyserRef,
    start,
    stop,
    reset,
  }
}
