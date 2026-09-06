/**
 * PCM-Helfer für iOS-sichere Wiedergabe.
 *
 * Safari spielt MediaRecorder-`audio/mp4` oft stumm ab. Ein klassisches
 * 16-bit-WAV aus dem dekodierten Puffer ist auf jedem iPhone hörbar.
 */

export function mixDownToMono(channels: readonly Float32Array[]): Float32Array {
  if (channels.length === 0) return new Float32Array(0)
  const first = channels[0]
  if (!first) return new Float32Array(0)
  if (channels.length === 1) return first

  const mixed = new Float32Array(first.length)
  const count = channels.length
  for (let index = 0; index < first.length; index += 1) {
    let sum = 0
    for (let channel = 0; channel < count; channel += 1) {
      sum += channels[channel]?.[index] ?? 0
    }
    mixed[index] = sum / count
  }
  return mixed
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index))
  }
}

/** Schreibt ein Mono-WAV (PCM 16-bit, little-endian). */
export function encodeMonoWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const safeRate = Number.isFinite(sampleRate) && sampleRate > 0 ? Math.round(sampleRate) : 44100
  const dataSize = samples.length * 2
  const view = new DataView(new ArrayBuffer(44 + dataSize))

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, safeRate, true)
  view.setUint32(28, safeRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0))
    view.setInt16(offset, sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff), true)
    offset += 2
  }

  return view.buffer
}

export function wavBlobFromMono(samples: Float32Array, sampleRate: number): Blob {
  return new Blob([encodeMonoWav(samples, sampleRate)], { type: 'audio/wav' })
}

/** RMS-Lautstärke (0–1) und Zero-Crossing-Stimmlage (0–1) eines PCM-Fensters. */
export function analysePcmWindow(
  samples: ArrayLike<number>,
  timeSeconds: number,
  sampleRate: number,
  windowSize = 1024
): { volume: number; tone: number } {
  if (samples.length === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return { volume: 0, tone: 0.5 }
  }

  const center = Math.floor(Math.max(0, timeSeconds) * sampleRate)
  const start = Math.max(0, center - Math.floor(windowSize / 2))
  const end = Math.min(samples.length, start + windowSize)
  const count = end - start
  if (count <= 1) return { volume: 0, tone: 0.5 }

  let sumOfSquares = 0
  let crossings = 0
  let previous = samples[start] ?? 0
  for (let index = start; index < end; index += 1) {
    const value = samples[index] ?? 0
    sumOfSquares += value * value
    if ((previous >= 0 && value < 0) || (previous < 0 && value >= 0)) {
      crossings += 1
    }
    previous = value
  }

  const rms = Math.sqrt(sumOfSquares / count)
  const volume = Math.min(1, rms * 3)
  const zcr = crossings / (count - 1)
  // Sprache: ZCR oft 0.02–0.25; spreizen auf eine sichtbare 0–1-Skala.
  const tone = Math.min(1, Math.max(0, zcr * 4))
  return { volume, tone }
}
