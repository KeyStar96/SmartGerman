/**
 * Reine Hilfsfunktionen für die Waveform-Darstellung.
 *
 * Bewusst frei von Browser-APIs: Die Funktionen arbeiten auf Zahlen-Arrays,
 * damit sie ohne DOM getestet werden können. Das Einsammeln der Rohdaten
 * (`AnalyserNode`, `decodeAudioData`) passiert in den Komponenten.
 */

/**
 * Anzahl der Pegelwerte in der laufenden Tonspur (`levels`-Array aus
 * `useAudioRecorder`). Dient nur noch als Fallback-Datenquelle für
 * `LiveWaveform`, falls kein `AnalyserNode` verfügbar ist – die eigentliche
 * Darstellung ist die Canvas-Siri-Wave (`FluidWaveform`), keine Balken mehr.
 */
export const WAVEFORM_BAR_COUNT = 48

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
 * Liest Lautstärke (Zeitbereich) und Stimmlage (Frequenzbereich) in einem
 * Schritt aus einem `AnalyserNode`. Puffer werden vom Aufrufer wiederverwendet,
 * damit pro Frame kein Garbage anfällt.
 */
export function analyseFrame(
  analyser: AnalyserNode,
  timeBuffer: Uint8Array<ArrayBuffer>,
  frequencyBuffer: Uint8Array<ArrayBuffer>
): { volume: number; tone: number } {
  analyser.getByteTimeDomainData(timeBuffer)
  analyser.getByteFrequencyData(frequencyBuffer)
  return {
    volume: levelFromTimeDomain(timeBuffer),
    tone: toneFromFrequency(frequencyBuffer),
  }
}

/**
 * Rechnet die Frequenz-Rohdaten eines `AnalyserNode` (`getByteFrequencyData`,
 * je Bucket 0–255) in einen normalisierten „Stimmlage"-Wert zwischen 0 und 1 um.
 *
 * Grundlage ist der spektrale Schwerpunkt (Spectral Centroid): der nach
 * Energie gewichtete mittlere Frequenz-Bucket. Tiefe/dunkle Stimmen liefern
 * einen niedrigen Wert, helle/hohe Laute (z. B. „s", „i") einen höheren.
 * So kann die Visualisierung nicht nur auf die Lautstärke, sondern auch auf
 * die Stimmlage reagieren (Wellenzahl/Dichte der Kurve).
 *
 * Bei Stille (keine Energie) wird ein neutraler Mittelwert (0.5) zurückgegeben,
 * damit die Welle nicht ruckartig auf 0 zusammenfällt.
 */
export function toneFromFrequency(data: ArrayLike<number>): number {
  if (data.length === 0) return 0.5

  let weightedSum = 0
  let energySum = 0
  for (let index = 0; index < data.length; index += 1) {
    const magnitude = data[index] ?? 0
    weightedSum += index * magnitude
    energySum += magnitude
  }

  // Ohne nennenswerte Energie (Pause) liefern wir einen neutralen Wert.
  if (energySum < 1) return 0.5

  const centroid = weightedSum / energySum / data.length
  // Sprache konzentriert sich in den unteren Buckets; der Faktor spreizt den
  // typischen Bereich (~0.05–0.35) auf eine deutlich sichtbare 0..1-Skala.
  return Math.min(1, Math.max(0, centroid * 2.6))
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

/** Anteil der bereits abgespielten Zeit, für die Fortschritts-Leiste unter der Welle. */
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

/**
 * Rät den MIME-Type einer Audio-URL anhand der Dateiendung.
 *
 * Dient dazu, VOR dem Abspielen per `audio.canPlayType()` zu prüfen, ob der
 * Browser das Format überhaupt kann (z.B. spielt Safari/iOS kein `webm`).
 * So lässt sich statt stummer Wiedergabe ein klarer Hinweis anzeigen.
 * Gibt einen leeren String zurück, wenn die Endung unbekannt ist.
 */
export function guessAudioMimeType(url: string): string {
  const withoutQuery = url.split('?')[0]?.toLowerCase() ?? ''
  if (withoutQuery.endsWith('.webm')) return 'audio/webm'
  if (withoutQuery.endsWith('.mp4') || withoutQuery.endsWith('.m4a')) return 'audio/mp4'
  if (withoutQuery.endsWith('.ogg') || withoutQuery.endsWith('.oga')) return 'audio/ogg'
  if (withoutQuery.endsWith('.mp3')) return 'audio/mpeg'
  if (withoutQuery.endsWith('.wav')) return 'audio/wav'
  return ''
}

/**
 * Nähert einen Wert pro Frame exponentiell an ein Ziel an (Lerp).
 *
 * Für die Siri-artige Live-Tonspur: Rohe Pegelwerte aus dem `AnalyserNode`
 * springen von Frame zu Frame stark. Statt den Zielwert direkt als Amplitude
 * zu zeichnen, nähert sich die tatsächlich gezeichnete Amplitude ihm nur zu
 * einem Anteil `smoothing` pro Frame an – das ergibt eine weiche, organische
 * Bewegung statt eines abgehackten Zitterns, ganz ohne mehrere Frames an
 * Historie verwalten zu müssen.
 */
export function smoothTowards(current: number, target: number, smoothing: number): number {
  const factor = Math.min(1, Math.max(0, smoothing))
  return current + (target - current) * factor
}

/**
 * Wählt in einem Zeitfenster den Sample-Wert mit der größten Auslenkung
 * von der Ruhelinie (128). So bleiben Sprachspitzen in der gezeichneten
 * Kurve sichtbar, statt durch Mittelung zu verschwinden.
 */
export function peakAtStep(data: ArrayLike<number>, step: number, totalSteps: number): number {
  if (data.length === 0 || totalSteps <= 0) return 128

  const safeStep = Math.min(Math.max(0, step), totalSteps - 1)
  const start = Math.floor((safeStep / totalSteps) * data.length)
  const end = Math.max(start + 1, Math.floor(((safeStep + 1) / totalSteps) * data.length))

  let farthest = 128
  let farthestDist = 0
  for (let index = start; index < end && index < data.length; index += 1) {
    const value = data[index] ?? 128
    const distance = Math.abs(value - 128)
    if (distance >= farthestDist) {
      farthestDist = distance
      farthest = value
    }
  }
  return farthest
}

/**
 * Laufzeit einer `AudioBufferSourceNode`-Wiedergabe aus dem AudioContext-Takt.
 * `offsetSeconds` ist die Position, an der `source.start(0, offset)` begann.
 */
export function playbackTimeFromClock(
  contextNow: number,
  startedAt: number,
  offsetSeconds: number,
  rate: number,
  duration: number
): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
  const elapsed = Math.max(0, contextNow - startedAt) * safeRate
  return Math.min(duration, Math.max(0, offsetSeconds + elapsed))
}
