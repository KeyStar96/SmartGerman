import {
  analyseFrame,
  appendLevel,
  formatDuration,
  levelFromTimeDomain,
  peakAtStep,
  playbackProgress,
  playbackTimeFromClock,
  seekTargetSeconds,
  smoothTowards,
  toneFromFrequency,
} from '@/lib/audio/waveform'

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

describe('analyseFrame', () => {
  it('liest Lautstärke und Stimmlage aus einem Analyser-ähnlichen Objekt', () => {
    const time = new Uint8Array(8).fill(128)
    const freq = new Uint8Array(8)
    freq.fill(200, 0, 2)
    const analyser = {
      getByteTimeDomainData: (buffer: Uint8Array) => {
        buffer.set(time)
      },
      getByteFrequencyData: (buffer: Uint8Array) => {
        buffer.set(freq)
      },
    } as unknown as AnalyserNode

    const frame = analyseFrame(analyser, new Uint8Array(8), new Uint8Array(8))
    expect(frame.volume).toBe(0)
    expect(frame.tone).toBeGreaterThanOrEqual(0)
    expect(frame.tone).toBeLessThan(0.5)
  })
})

describe('toneFromFrequency', () => {
  it('gibt bei leeren Daten einen neutralen Mittelwert zurück', () => {
    expect(toneFromFrequency(new Uint8Array(0))).toBe(0.5)
  })

  it('gibt bei Stille (keine Energie) einen neutralen Mittelwert zurück', () => {
    expect(toneFromFrequency(new Uint8Array(64).fill(0))).toBe(0.5)
  })

  it('meldet bei tiefer Energie (untere Buckets) einen niedrigen Wert', () => {
    const data = new Uint8Array(64)
    data.fill(200, 0, 6) // Energie nur ganz unten
    const lowTone = toneFromFrequency(data)
    expect(lowTone).toBeGreaterThanOrEqual(0)
    expect(lowTone).toBeLessThan(0.4)
  })

  it('meldet bei hoher Energie (obere Buckets) einen höheren Wert', () => {
    const low = new Uint8Array(64)
    low.fill(200, 0, 6)
    const high = new Uint8Array(64)
    high.fill(200, 48, 64) // Energie weit oben
    expect(toneFromFrequency(high)).toBeGreaterThan(toneFromFrequency(low))
  })

  it('bleibt im Bereich 0 bis 1', () => {
    const data = new Uint8Array(32).fill(255)
    const tone = toneFromFrequency(data)
    expect(tone).toBeGreaterThanOrEqual(0)
    expect(tone).toBeLessThanOrEqual(1)
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

describe('smoothTowards', () => {
  it('erreicht das Ziel sofort bei Glättung 1', () => {
    expect(smoothTowards(0, 1, 1)).toBe(1)
  })

  it('bleibt beim aktuellen Wert bei Glättung 0', () => {
    expect(smoothTowards(0.3, 1, 0)).toBe(0.3)
  })

  it('nähert sich schrittweise an, statt zu springen', () => {
    const step1 = smoothTowards(0, 1, 0.2)
    expect(step1).toBeCloseTo(0.2)
    const step2 = smoothTowards(step1, 1, 0.2)
    expect(step2).toBeGreaterThan(step1)
    expect(step2).toBeLessThan(1)
  })

  it('begrenzt den Glättungsfaktor auf 0 bis 1', () => {
    expect(smoothTowards(0, 1, -5)).toBe(0)
    expect(smoothTowards(0, 1, 5)).toBe(1)
  })
})

describe('peakAtStep', () => {
  it('liefert 128 bei leeren Daten', () => {
    expect(peakAtStep([], 0, 8)).toBe(128)
  })

  it('nimmt im Fenster den Wert mit der größten Auslenkung', () => {
    const data = new Uint8Array([128, 128, 200, 128, 40, 128])
    expect(peakAtStep(data, 0, 2)).toBe(200)
    expect(peakAtStep(data, 1, 2)).toBe(40)
  })
})

describe('playbackTimeFromClock', () => {
  it('addiert die verstrichene Context-Zeit zum Start-Offset', () => {
    expect(playbackTimeFromClock(5, 3, 1, 1, 20)).toBe(3)
  })

  it('berücksichtigt das Playback-Tempo', () => {
    expect(playbackTimeFromClock(5, 3, 0, 0.5, 20)).toBe(1)
  })

  it('begrenzt auf die Dauer', () => {
    expect(playbackTimeFromClock(50, 0, 0, 1, 10)).toBe(10)
    expect(playbackTimeFromClock(2, 0, 0, 1, 0)).toBe(0)
  })
})
