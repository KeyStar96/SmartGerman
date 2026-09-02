import {
  WAVEFORM_BAR_COUNT,
  WAVEFORM_MIN_BAR_PERCENT,
  appendLevel,
  barHeightPercent,
  extractPeaks,
  formatDuration,
  levelFromTimeDomain,
  normalizePeaks,
  playbackProgress,
  seekTargetSeconds,
} from '@/lib/audio/waveform'

describe('extractPeaks', () => {
  it('verdichtet Samples auf die gewünschte Balkenzahl', () => {
    const samples = Array.from({ length: 1000 }, (_, index) => index / 1000)
    expect(extractPeaks(samples, 10)).toHaveLength(10)
    expect(extractPeaks(samples)).toHaveLength(WAVEFORM_BAR_COUNT)
  })

  it('nimmt je Abschnitt den Spitzenwert, nicht den Mittelwert', () => {
    // Ein einzelner Ausschlag im zweiten Viertel muss sichtbar bleiben.
    const samples = [0, 0, 0.9, 0, 0, 0, 0, 0]
    expect(extractPeaks(samples, 4)).toEqual([0, 0.9, 0, 0])
  })

  it('behandelt negative Amplituden wie positive', () => {
    expect(extractPeaks([-0.7, 0.2], 1)).toEqual([0.7])
  })

  it('liefert bei leeren Daten Nullen statt einer leeren Liste', () => {
    expect(extractPeaks([], 5)).toEqual([0, 0, 0, 0, 0])
  })

  it('kommt mit mehr Balken als Samples zurecht', () => {
    const peaks = extractPeaks([0.5, 0.25], 6)
    expect(peaks).toHaveLength(6)
    expect(peaks.every((value) => value >= 0)).toBe(true)
  })
})

describe('normalizePeaks', () => {
  it('skaliert den lautesten Balken auf 1', () => {
    expect(normalizePeaks([0.1, 0.2, 0.4])).toEqual([0.25, 0.5, 1])
  })

  it('lässt eine stille Aufnahme flach', () => {
    expect(normalizePeaks([0, 0, 0])).toEqual([0, 0, 0])
  })
})

describe('barHeightPercent', () => {
  it('hält die Mindesthöhe für Stille ein', () => {
    expect(barHeightPercent(0)).toBe(WAVEFORM_MIN_BAR_PERCENT)
  })

  it('nutzt bei Vollausschlag die ganze Höhe', () => {
    expect(barHeightPercent(1)).toBe(100)
  })

  it('begrenzt Werte außerhalb von 0 bis 1', () => {
    expect(barHeightPercent(-3)).toBe(WAVEFORM_MIN_BAR_PERCENT)
    expect(barHeightPercent(7)).toBe(100)
  })
})

describe('levelFromTimeDomain', () => {
  it('meldet bei Stille (Ruhewert 128) keinen Pegel', () => {
    expect(levelFromTimeDomain(new Uint8Array(64).fill(128))).toBe(0)
  })

  it('meldet bei Vollausschlag den maximalen Pegel', () => {
    expect(levelFromTimeDomain(new Uint8Array(64).fill(255))).toBe(1)
  })

  it('liegt bei normaler Sprache im mittleren Bereich', () => {
    const data = Uint8Array.from({ length: 64 }, (_, index) =>
      index % 2 === 0 ? 148 : 108
    )
    const level = levelFromTimeDomain(data)
    expect(level).toBeGreaterThan(0)
    expect(level).toBeLessThan(1)
  })

  it('gibt bei leeren Daten 0 zurück', () => {
    expect(levelFromTimeDomain(new Uint8Array(0))).toBe(0)
  })
})

describe('appendLevel', () => {
  it('füllt die Spur von links auf', () => {
    expect(appendLevel([], 0.5, 3)).toEqual([0.5])
    expect(appendLevel([0.5], 0.2, 3)).toEqual([0.5, 0.2])
  })

  it('scrollt erst, wenn die Spur voll ist', () => {
    expect(appendLevel([0.1, 0.2, 0.3], 0.4, 3)).toEqual([0.2, 0.3, 0.4])
  })

  it('begrenzt den Pegel auf 0 bis 1', () => {
    expect(appendLevel([], 4, 3)).toEqual([1])
    expect(appendLevel([], -2, 3)).toEqual([0])
  })
})

describe('formatDuration', () => {
  it('formatiert Sekunden als m:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(7)).toBe('0:07')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(600)).toBe('10:00')
  })

  it('fängt unbrauchbare Werte ab', () => {
    expect(formatDuration(Number.NaN)).toBe('0:00')
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00')
    expect(formatDuration(-5)).toBe('0:00')
  })
})

describe('playbackProgress und seekTargetSeconds', () => {
  it('rechnet den Fortschritt als Anteil', () => {
    expect(playbackProgress(5, 10)).toBe(0.5)
    expect(playbackProgress(12, 10)).toBe(1)
    expect(playbackProgress(5, 0)).toBe(0)
  })

  it('übersetzt einen Tap auf die Tonspur in Sekunden', () => {
    expect(seekTargetSeconds(50, 100, 20)).toBe(10)
    expect(seekTargetSeconds(0, 100, 20)).toBe(0)
    expect(seekTargetSeconds(500, 100, 20)).toBe(20)
  })

  it('bleibt bei fehlender Dauer bei 0', () => {
    expect(seekTargetSeconds(50, 100, 0)).toBe(0)
    expect(seekTargetSeconds(50, 0, 20)).toBe(0)
  })
})
