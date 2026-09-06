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
 * Bewusst datenquellen-agnostisch: `getVolume()` / `getTone()` liefern pro
 * Frame nur Zahlen zwischen 0 und 1 – die Quelle (Mikrofon-`AnalyserNode`
 * oder Wiedergabe-`AnalyserNode`) entscheidet der Aufrufer. Lautstärke
 * steuert die Amplitude, Stimmlage die Wellendichte.
 *
 * Zeichnet nur, während `isActive` true ist, mit `requestAnimationFrame`;
 * im inaktiven Zustand wird ein einzelner ruhiger Frame gezeichnet und die
 * Schleife gestoppt – wichtig, wenn mehrere Player gleichzeitig auf einer
 * Seite stehen (z.B. `SubmissionHistory`), damit nicht viele Canvas-Loops
 * parallel und unnötig CPU verbrauchen.
 */
export default function FluidWaveform({
  getVolume,
  getTone,
  isActive,
  className,
}: {
  /** Liefert bei jedem Frame den aktuellen Pegel (0..1). Wird per Ref gehalten, kein Trigger für Effect-Neustarts. */
  getVolume: () => number
  /**
   * Optionaler Stimmlage-Wert (0..1) aus `getByteFrequencyData`.
   * Höhere Werte verdichten die Welle (mehr Berge), tiefe Stimmen strecken sie.
   */
  getTone?: () => number
  /** Ob gerade Ton läuft. `false` zeichnet einmalig eine ruhige Linie statt dauerhaft zu animieren. */
  isActive: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const getVolumeRef = useRef(getVolume)
  getVolumeRef.current = getVolume
  const getToneRef = useRef(getTone)
  getToneRef.current = getTone

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameHandle: number | null = null
    let disposed = false
    let amplitude = 0
    let tone = 0.5
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
      const maxSwing = height * 0.42
      // Pausen: Welle flacht fast auf die Mittellinie ab. Laute/prägnante
      // Sprache nutzt die volle Höhe. Kein künstlicher Mindesthub mehr –
      // Stille muss sichtbar still sein.
      const swingFactor = amplitude
      // Tiefe Stimme streckt die Welle, helle Laute verdichten sie.
      const density = 0.7 + tone * 0.9

      for (const layer of WAVE_LAYERS) {
        ctx.beginPath()
        for (let step = 0; step <= CURVE_STEPS; step += 1) {
          const t = step / CURVE_STEPS
          const x = t * width
          const y =
            midY +
            Math.sin(t * Math.PI * 2 * layer.frequency * density + phase * layer.speed) *
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
        const toneTarget = getToneRef.current ? getToneRef.current() : 0.5
        tone = smoothTowards(tone, toneTarget, smoothing)
        phase += phaseSpeed * (0.7 + amplitude * 0.6)
        drawFrame()
      }
      frameHandle = requestAnimationFrame(animate)
    } else {
      // Einmaliger ruhiger Frame statt Dauerschleife – spart CPU, wenn z.B.
      // mehrere Player in einer Liste gleichzeitig inaktiv sind.
      amplitude = 0
      tone = 0.5
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
