import { computePhaseDistribution } from '@/lib/vocabulary-ui'
import type { LeitnerPhase } from '@/lib/leitner'

function card(phase: LeitnerPhase | null, isLearned = false) {
  return { phase, isLearned }
}

describe('computePhaseDistribution', () => {
  it('zählt Phasen, Gelerntes und unberührte Karten getrennt', () => {
    const result = computePhaseDistribution([
      card(1),
      card(1),
      card(3),
      card(6, true),
      card(null),
    ])

    expect(result.totalCards).toBe(5)
    expect(result.totalInBox).toBe(4)
    expect(result.buckets).toEqual([
      { key: 1, count: 2 },
      { key: 2, count: 0 },
      { key: 3, count: 1 },
      { key: 4, count: 0 },
      { key: 5, count: 0 },
      { key: 6, count: 0 },
      { key: 'learned', count: 1 },
    ])
  })

  it('liefert 0% ohne Karten und 100% wenn alles gelernt ist', () => {
    expect(computePhaseDistribution([]).overallPercent).toBe(0)
    expect(computePhaseDistribution([card(6, true), card(6, true)]).overallPercent).toBe(100)
  })

  it('rechnet unberührte Karten als 0 und Phase 1 als 1/7 in den Gesamtfortschritt', () => {
    // Eine unberührte + eine Phase-1-Karte: (0 + 1) / (2 * 7) = 7.14% → 7%
    expect(computePhaseDistribution([card(null), card(1)]).overallPercent).toBe(7)
  })
})
