'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { formatDuration, levelFromTimeDomain, smoothTowards } from '@/lib/audio/waveform'

/** Eine phasenverschobene Sinus-Schicht der Siri-Wave. */
interface WaveLayer {
  /** Anzahl der Wellenberge über die volle Breite. */
  frequency: number
  /** Phasengeschwindigkeit relativ zur Basisgeschwindigkeit (Vorzeichen = Richtung). */
  speed: number
  /** Anteil der maximalen Auslenkung, den diese Schicht nutzt. */
  scale: number
  /** Deckkraft der Linie in der Mitte des Farbverlaufs. */
  alpha: number
  /** Linienbreite in CSS-Pixeln. */
  lineWidth: number
}

/**
 * Drei überlagerte, unterschiedlich schnelle Wellen ergeben zusammen die
 * organische, "atmende" Siri-Optik statt einer einzelnen starren Sinuskurve.
 */
const WAVE_LAYERS: readonly WaveLayer[] = [
  { frequency: 1.1, speed: 1, scale: 1, alpha: 0.95, lineWidth: 3.2 },
  { frequency: 1.6, speed: -1.4, scale: 0.7, alpha: 0.55, lineWidth: 2.4 },
  { frequency: 2.3, speed: 1.8, scale: 0.45, alpha: 0.35, lineWidth: 1.8 },
]

/** Anzahl der Geradenstücke pro Welle – 64 reicht für glatte Kurven bei üblicher Kartenbreite. */
const CURVE_STEPS = 64

interface WindowWithLegacyAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Siri-artige, fließende Tonspur der laufenden Aufnahme.
 *
 * Zeichnet auf einem `<canvas>` mehrere phasenverschobene, weich schwingende
 * Sinus-Wellen in warmen Orangetönen. Die Amplitude reagiert in Echtzeit auf
 * die Mikrofon-Lautstärke: Pro Frame wird der aktuelle Pegel direkt aus dem
 * `AnalyserNode` (Web Audio API, aus `useAudioRecorder`) gelesen und per
 * `smoothTowards` weich an die zuvor gezeichnete Amplitude angenähert – so
 * bleibt die Bewegung auch zwischen zwei Pegel-Änderungen flüssig.
 *
 * Ohne `analyserRef` (z.B. Browser ohne AudioContext-Unterstützung) fällt
 * die Komponente auf den zuletzt bekannten Wert aus `levels` zurück, damit
 * die Aufnahme trotzdem sichtbar begleitet wird.
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const levelsRef = useRef<readonly number[]>(levels)
  levelsRef.current = levels

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameHandle: number | null = null
    let dataBuffer: Uint8Array<ArrayBuffer> | null = null
    let amplitude = 0
    let phase = 0
    let disposed = false

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const reducedMotion = prefersReducedMotion()
    // Bei "reduzierter Bewegung" schwingt die Welle langsamer und glättet
    // stärker – bewusst nicht komplett statisch, sonst wirkt eine laufende
    // Aufnahme wie eingefroren (Geragogik: Rückmeldung muss erkennbar bleiben).
    const phaseSpeed = reducedMotion ? 0.012 : 0.045
    const smoothing = reducedMotion ? 0.08 : 0.18

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
    }
    resize()

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    resizeObserver?.observe(container)

    /** Aktueller Lautstärke-Pegel (0–1), direkt vom AnalyserNode oder als Fallback aus `levels`. */
    const readVolume = (): number => {
      const analyser = analyserRef?.current
      if (analyser) {
        if (!dataBuffer || dataBuffer.length !== analyser.fftSize) {
          dataBuffer = new Uint8Array(analyser.fftSize)
        }
        analyser.getByteTimeDomainData(dataBuffer)
        return levelFromTimeDomain(dataBuffer)
      }

      const fallback = levelsRef.current
      return fallback.length > 0 ? (fallback[fallback.length - 1] ?? 0) : 0
    }

    const draw = () => {
      if (disposed) return
      frameHandle = requestAnimationFrame(draw)

      const width = canvas.width
      const height = canvas.height
      if (width === 0 || height === 0) return

      const target = isActive ? readVolume() : 0
      amplitude = smoothTowards(amplitude, target, smoothing)
      phase += phaseSpeed

      ctx.clearRect(0, 0, width, height)

      const midY = height / 2
      const maxSwing = height * 0.36
      // Auch ohne Pegel leicht sichtbar schwingen lassen (0.15), damit eine
      // stille Aufnahme nicht wie eine tote Linie aussieht.
      const swingFactor = 0.15 + amplitude * 0.85

      for (const layer of WAVE_LAYERS) {
        ctx.beginPath()
        for (let step = 0; step <= CURVE_STEPS; step += 1) {
          const t = step / CURVE_STEPS
          const x = t * width
          const y =
            midY +
            Math.sin(t * Math.PI * 2 * layer.frequency + phase * layer.speed) *
              maxSwing *
              layer.scale *
              swingFactor
          if (step === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, 'rgba(255, 92, 0, 0)')
        gradient.addColorStop(0.5, `rgba(255, 122, 26, ${layer.alpha})`)
        gradient.addColorStop(1, 'rgba(255, 92, 0, 0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = layer.lineWidth * dpr
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = 'rgba(255, 122, 26, 0.55)'
        ctx.shadowBlur = 10 * dpr
        ctx.stroke()
      }
    }

    frameHandle = requestAnimationFrame(draw)

    return () => {
      disposed = true
      if (frameHandle !== null) cancelAnimationFrame(frameHandle)
      resizeObserver?.disconnect()
    }
    // `analyserRef` ist ein stabiles Ref-Objekt (keine neue Referenz pro
    // Render), daher hier unbedenklich als Dependency.
  }, [analyserRef, isActive])

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        className="h-24 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-orange-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      <p className="mt-2 text-center text-lg font-semibold tabular-nums text-slate-600 dark:text-slate-300">
        {formatDuration(elapsedSeconds)}
      </p>
    </div>
  )
}
