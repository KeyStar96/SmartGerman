'use client'

import { useEffect, useRef } from 'react'
import { smoothTowards } from '@/lib/audio/waveform'

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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Wiederverwendbare Siri-artige, fließende Tonspur auf `<canvas>`.
 *
 * Bewusst datenquellen-agnostisch: `getVolume()` liefert bei jedem Frame nur
 * einen Pegelwert zwischen 0 und 1 – woher der Wert kommt, entscheidet der
 * Aufrufer. Aktuell zwei Quellen im Projekt:
 *  - `LiveWaveform` (laufende Aufnahme): liest den Pegel direkt aus dem
 *    `AnalyserNode` von `useAudioRecorder` (echte Mikrofon-Lautstärke).
 *  - `WaveformPlayer` (Wiedergabe einer fertigen Aufnahme): simuliert den
 *    Pegel bewusst über sanft überlagerte Sinuswellen statt über einen
 *    echten `AnalyserNode` am `<audio>`-Element – das würde die
 *    Wiedergabe über den Web-Audio-Graphen umleiten (Stummschaltungsrisiko
 *    bei Fehlkonfiguration, doppelte Quellknoten bei Re-Renders, CORS-
 *    Abhängigkeit vom Storage-Bucket) und ist damit für die Kernfunktion
 *    "Aufnahme anhören" zu riskant. Die Sinus-Simulation ist eine bewusste,
 *    vom Projekt akzeptierte Alternative (siehe Aufgabenstellung).
 *
 * Zeichnet nur, während `isActive` true ist, mit `requestAnimationFrame`;
 * im inaktiven Zustand wird ein einzelner ruhiger Frame gezeichnet und die
 * Schleife gestoppt – wichtig, wenn mehrere Player gleichzeitig auf einer
 * Seite stehen (z.B. `SubmissionHistory`), damit nicht viele Canvas-Loops
 * parallel und unnötig CPU verbrauchen.
 */
export default function FluidWaveform({
  getVolume,
  isActive,
  className,
}: {
  /** Liefert bei jedem Frame den aktuellen Pegel (0..1). Wird per Ref gehalten, kein Trigger für Effect-Neustarts. */
  getVolume: () => number
  /** Ob gerade Ton läuft. `false` zeichnet einmalig eine ruhige Linie statt dauerhaft zu animieren. */
  isActive: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const getVolumeRef = useRef(getVolume)
  getVolumeRef.current = getVolume

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameHandle: number | null = null
    let disposed = false
    let amplitude = 0
    let phase = 0

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const reducedMotion = prefersReducedMotion()
    // Bei "reduzierter Bewegung" schwingt die Welle langsamer und glättet
    // stärker – bewusst nicht komplett statisch, sonst wirkt eine laufende
    // Aufnahme/Wiedergabe wie eingefroren (Geragogik: Rückmeldung muss erkennbar bleiben).
    const phaseSpeed = reducedMotion ? 0.012 : 0.045
    const smoothing = reducedMotion ? 0.08 : 0.18

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
    }
    resize()

    const drawFrame = () => {
      const width = canvas.width
      const height = canvas.height
      if (width === 0 || height === 0) return

      ctx.clearRect(0, 0, width, height)

      const midY = height / 2
      const maxSwing = height * 0.36
      // Auch ohne Pegel leicht sichtbar schwingen lassen (0.15), damit eine
      // stille Aufnahme/Pause nicht wie eine tote Linie aussieht.
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

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            resize()
            // Ohne laufende Schleife (inaktiv) muss der Resize selbst neu zeichnen.
            if (!frameHandle) drawFrame()
          })
        : null
    resizeObserver?.observe(container)

    if (isActive) {
      const animate = () => {
        if (disposed) return
        frameHandle = requestAnimationFrame(animate)
        amplitude = smoothTowards(amplitude, getVolumeRef.current(), smoothing)
        phase += phaseSpeed
        drawFrame()
      }
      frameHandle = requestAnimationFrame(animate)
    } else {
      // Einmaliger ruhiger Frame statt Dauerschleife – spart CPU, wenn z.B.
      // mehrere Player in einer Liste gleichzeitig inaktiv sind.
      amplitude = 0
      phase = 0
      drawFrame()
    }

    return () => {
      disposed = true
      if (frameHandle !== null) cancelAnimationFrame(frameHandle)
      resizeObserver?.disconnect()
    }
  }, [isActive])

  return (
    <div ref={containerRef} className={className ?? 'h-full w-full'}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
