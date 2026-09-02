/**
 * Reine Hilfsfunktionen für die Waveform-Darstellung.
 *
 * Bewusst frei von Browser-APIs: Die Funktionen arbeiten auf Zahlen-Arrays,
 * damit sie ohne DOM getestet werden können. Das Einsammeln der Rohdaten
 * (`AnalyserNode`, `decodeAudioData`) passiert in den Komponenten.
 */

/** Anzahl der Balken in der Tonspur. Bei ~48px Breite je Balkenpaar gut sichtbar. */
export const WAVEFORM_BAR_COUNT = 48

/** Mindesthöhe eines Balkens in Prozent, damit auch Stille sichtbar bleibt. */
export const WAVEFORM_MIN_BAR_PERCENT = 6

/**
 * Verdichtet Audio-Samples zu einer festen Anzahl von Balken.
 *
 * Je Abschnitt wird der Spitzenwert genommen (nicht der Mittelwert): Bei
 * Sprache erzeugt der Mittelwert eine flache, wenig aussagekräftige Linie.
 */
export function extractPeaks(
  samples: ArrayLike<number>,
  barCount: number = WAVEFORM_BAR_COUNT
): number[] {
  const bars = Math.max(1, Math.floor(barCount))
  if (samples.length === 0) return new Array<number>(bars).fill(0)

  const peaks: number[] = new Array<number>(bars).fill(0)
  const samplesPerBar = samples.length / bars

  for (let bar = 0; bar < bars; bar += 1) {
    const start = Math.floor(bar * samplesPerBar)
    const end = Math.min(samples.length, Math.floor((bar + 1) * samplesPerBar))
    let peak = 0

    for (let index = start; index < Math.max(end, start + 1); index += 1) {
      const value = Math.abs(samples[index] ?? 0)
      if (value > peak) peak = value
    }

    peaks[bar] = peak
  }

  return peaks
}

/**
 * Skaliert Spitzenwerte auf 0–1, bezogen auf den lautesten Balken.
 *
 * Eine leise Aufnahme sieht dadurch genauso deutlich aus wie eine laute –
 * für unsere Zielgruppe wichtiger als eine absolut korrekte Pegelanzeige.
 */
export function normalizePeaks(peaks: readonly number[]): number[] {
  const loudest = peaks.reduce((max, value) => (value > max ? value : max), 0)
  if (loudest <= 0) return peaks.map(() => 0)
  return peaks.map((value) => Math.min(1, Math.max(0, value / loudest)))
}

/** Höhe eines Balkens in Prozent, inklusive Mindesthöhe für Stille. */
export function barHeightPercent(
  normalizedPeak: number,
  minPercent: number = WAVEFORM_MIN_BAR_PERCENT
): number {
  const clamped = Math.min(1, Math.max(0, normalizedPeak))
  return Math.round(minPercent + clamped * (100 - minPercent))
}

/**
 * Rechnet die Rohdaten eines `AnalyserNode` (Zeitbereich, 0–255 um 128
 * zentriert) in einen einzelnen Pegelwert zwischen 0 und 1 um.
 */
export function levelFromTimeDomain(data: ArrayLike<number>): number {
  if (data.length === 0) return 0

  let sumOfSquares = 0
  for (let index = 0; index < data.length; index += 1) {
    const centered = ((data[index] ?? 128) - 128) / 128
    sumOfSquares += centered * centered
  }

  const rootMeanSquare = Math.sqrt(sumOfSquares / data.length)
  // Sprache liegt meist bei RMS 0.05–0.3; der Faktor spreizt das auf die volle Höhe.
  return Math.min(1, rootMeanSquare * 3)
}

/**
 * Schiebt einen neuen Pegelwert in die laufende Tonspur.
 *
 * Die Anzeige wächst von links nach rechts und scrollt erst, wenn sie voll
 * ist – so wirkt eine kurze Aufnahme nicht wie eine fast leere Fläche.
 */
export function appendLevel(
  levels: readonly number[],
  level: number,
  barCount: number = WAVEFORM_BAR_COUNT
): number[] {
  const clamped = Math.min(1, Math.max(0, level))
  const next = [...levels, clamped]
  return next.length > barCount ? next.slice(next.length - barCount) : next
}

/** Formatiert Sekunden als `m:ss` für die Anzeige unter der Tonspur. */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = Math.floor(safeSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Anteil der bereits abgespielten Zeit, für die Einfärbung der Balken. */
export function playbackProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.min(1, Math.max(0, currentTime / duration))
}

/**
 * Rechnet einen Klick auf die Tonspur in eine Abspielposition um.
 * `offsetX` und `width` kommen aus dem Bounding-Rect des Containers.
 */
export function seekTargetSeconds(offsetX: number, width: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || width <= 0) return 0
  const ratio = Math.min(1, Math.max(0, offsetX / width))
  return ratio * duration
}
