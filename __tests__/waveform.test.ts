import {
  appendLevel,
  formatDuration,
  levelFromTimeDomain,
  playbackProgress,
  seekTargetSeconds,
  smoothTowards,
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
