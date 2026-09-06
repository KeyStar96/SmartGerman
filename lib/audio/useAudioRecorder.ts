'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  blobTypeForRecorder,
  browserPrefersMp4Recording,
  createAnalyserNode,
  ensureAudioContext,
  pickRecorderMimeType,
  unlockAudioContext,
} from '@/lib/audio/web-audio'
import { appendLevel, levelFromTimeDomain, WAVEFORM_BAR_COUNT } from '@/lib/audio/waveform'

/**
 * Gemeinsame Aufnahme-Logik für Schüler und Lehrkraft.
 *
 * Kapselt `getUserMedia`, `MediaRecorder` und den `AnalyserNode` für die
 * live mitlaufende Tonspur. Der AudioContext wird geteilt und nicht
 * geschlossen – auf iOS führt `close()` sonst zu stummer Wiedergabe.
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

/** Abstand zwischen zwei Balken der laufenden Tonspur. */
const LEVEL_SAMPLE_INTERVAL_MS = 110

function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
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
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
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

  /** Gibt Mikrofon, Knoten und die Animationsschleife frei – nicht den Context. */
  const teardown = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
      } catch {
        // Bereits getrennt.
      }
      sourceNodeRef.current = null
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {
        // Bereits getrennt.
      }
      analyserRef.current = null
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

    // Noch in der Nutzer-Geste: Context anlegen und resume anstoßen.
    // Nach `await getUserMedia` ist die iOS-Geste verbraucht.
    const context = ensureAudioContext()
    void context?.resume()

    releaseObjectUrl()
    setAudioUrl(null)
    setAudioBlob(null)
    setLevels([])
    setElapsedSeconds(0)
    setStatus('requesting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (err) {
      console.error('Mikrofon-Zugriff nicht möglich:', err)
      setStatus('denied')
      return
    }

    streamRef.current = stream

    try {
      await unlockAudioContext()

      const preferMp4 = browserPrefersMp4Recording()
      const mimeType = pickRecorderMimeType(
        (candidate) => MediaRecorder.isTypeSupported(candidate),
        preferMp4
      )
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const type = blobTypeForRecorder(recorder.mimeType, mimeType, preferMp4)
        const blob = new Blob(chunksRef.current, { type })
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

      const runningContext = ensureAudioContext()
      if (runningContext && runningContext.state !== 'closed') {
        const analyser = createAnalyserNode(runningContext)
        const source = runningContext.createMediaStreamSource(stream)
        source.connect(analyser)
        sourceNodeRef.current = source
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

      // timeslice: iOS flush't sonst oft erst beim Stopp einen leeren Container.
      recorder.start(250)
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
