'use client'

import { analyseFrame } from '@/lib/audio/waveform'

/**
 * Hängt einen `AnalyserNode` an ein `<audio>`-Element, ohne die Wiedergabe
 * stummzuschalten.
 *
 * `createMediaElementSource` darf pro Element nur einmal aufgerufen werden
 * und zieht den Ton vollständig in den Web-Audio-Graphen. Deshalb:
 *  - Quelle wird in einer WeakMap gecacht (Re-Renders / Strict Mode)
 *  - Quelle → Analyser → Destination, sonst ist nichts zu hören
 *  - `AudioContext.resume()` erst nach einer Nutzer-Geste (Play-Klick)
 *
 * CORS: Für `http(s)`-URLs muss das Element `crossOrigin="anonymous"` haben,
 * sonst liefert der Analyser nur Stille. Blob-URLs (eigene Aufnahmen) brauchen
 * das nicht.
 */

interface WindowWithLegacyAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext
}

interface PlaybackGraph {
  context: AudioContext
  analyser: AnalyserNode
  timeBuffer: Uint8Array<ArrayBuffer>
  frequencyBuffer: Uint8Array<ArrayBuffer>
}

const graphs = new WeakMap<HTMLAudioElement, PlaybackGraph>()

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const legacy = (window as WindowWithLegacyAudioContext).webkitAudioContext
  const Ctor = window.AudioContext ?? legacy
  return Ctor ? new Ctor() : null
}

function ensureGraph(audio: HTMLAudioElement): PlaybackGraph | null {
  const existing = graphs.get(audio)
  if (existing) return existing

  const context = createAudioContext()
  if (!context) return null

  try {
    const source = context.createMediaElementSource(audio)
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.55
    source.connect(analyser)
    analyser.connect(context.destination)

    const graph: PlaybackGraph = {
      context,
      analyser,
      timeBuffer: new Uint8Array(analyser.fftSize),
      frequencyBuffer: new Uint8Array(analyser.frequencyBinCount),
    }
    graphs.set(audio, graph)
    return graph
  } catch (err) {
    console.error('Wiedergabe-Analyser konnte nicht erzeugt werden:', err)
    return null
  }
}

/** Baut den Graphen auf (idempotent) und gibt den Context für `resume()` zurück. */
export function attachPlaybackAnalyser(audio: HTMLAudioElement): PlaybackGraph | null {
  return ensureGraph(audio)
}

/** Muss aus einem Klick-Handler aufgerufen werden, sonst bleibt der Context suspendiert. */
export async function resumePlaybackAnalyser(audio: HTMLAudioElement): Promise<void> {
  const graph = ensureGraph(audio)
  if (!graph) return
  if (graph.context.state === 'suspended') {
    try {
      await graph.context.resume()
    } catch (err) {
      console.error('AudioContext konnte nicht fortgesetzt werden:', err)
    }
  }
}

export function readPlaybackAnalysis(audio: HTMLAudioElement): { volume: number; tone: number } {
  const graph = graphs.get(audio)
  if (!graph) return { volume: 0, tone: 0.5 }
  return analyseFrame(graph.analyser, graph.timeBuffer, graph.frequencyBuffer)
}
