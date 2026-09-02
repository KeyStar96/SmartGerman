import {
  LEITNER_LEARNED_BOX,
  LEITNER_PHASES,
  PHASE_INTERVALS_IN_DAYS,
  applyLeitnerAnswer,
  intervalForPhase,
  isLearned,
  isLeitnerPhase,
  nextReviewDateForBox,
  normalizeBox,
  phaseProgressPercent,
} from '@/lib/leitner'

const NOW = new Date('2026-03-01T09:00:00.000Z')

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

describe('Phasenmodell', () => {
  it('hat genau sechs aktive Phasen', () => {
    expect(LEITNER_PHASES).toEqual([1, 2, 3, 4, 5, 6])
    expect(LEITNER_LEARNED_BOX).toBe(7)
  })

  it('bildet die Intervalle Tag 1, 1, 3, 9, 29, 90 ab', () => {
    expect(PHASE_INTERVALS_IN_DAYS).toEqual({ 1: 1, 2: 1, 3: 3, 4: 9, 5: 29, 6: 90 })
  })

  it('erkennt gültige Phasen', () => {
    expect(isLeitnerPhase(1)).toBe(true)
    expect(isLeitnerPhase(6)).toBe(true)
    expect(isLeitnerPhase(7)).toBe(false)
    expect(isLeitnerPhase(0)).toBe(false)
    expect(isLeitnerPhase(2.5)).toBe(false)
  })

  it('halbiert das Intervall für kontrastiv schwere Vokabeln', () => {
    expect(intervalForPhase(5)).toBe(29)
    expect(intervalForPhase(5, true)).toBe(14)
    expect(intervalForPhase(1, true)).toBe(1)
    expect(intervalForPhase(2, true)).toBe(1)
  })
})

describe('normalizeBox', () => {
  it('fängt fehlende und ungültige Werte ab', () => {
    expect(normalizeBox(null)).toBe(1)
    expect(normalizeBox(undefined)).toBe(1)
    expect(normalizeBox(Number.NaN)).toBe(1)
    expect(normalizeBox(0)).toBe(1)
    expect(normalizeBox(-4)).toBe(1)
  })

  it('deckelt Altbestände oberhalb des Lernzustands', () => {
    expect(normalizeBox(7)).toBe(LEITNER_LEARNED_BOX)
    expect(normalizeBox(12)).toBe(LEITNER_LEARNED_BOX)
  })

  it('erkennt den Lernzustand', () => {
    expect(isLearned(7)).toBe(true)
    expect(isLearned(6)).toBe(false)
    expect(isLearned(null)).toBe(false)
  })
})

describe('applyLeitnerAnswer – richtige Antwort', () => {
  it('geht genau eine Phase weiter', () => {
    const result = applyLeitnerAnswer({ currentBox: 1, isCorrect: true, now: NOW })

    expect(result.previousPhase).toBe(1)
    expect(result.newPhase).toBe(2)
    expect(result.newBox).toBe(2)
    expect(result.movedBack).toBe(false)
    expect(result.becameLearned).toBe(false)
  })

  it('vergibt für jede Zielphase das passende Intervall', () => {
    const expected: Array<[number, number]> = [
      [1, 1],
      [2, 3],
      [3, 9],
      [4, 29],
      [5, 90],
    ]

    for (const [currentBox, intervalInDays] of expected) {
      const result = applyLeitnerAnswer({ currentBox, isCorrect: true, now: NOW })
      expect(result.intervalInDays).toBe(intervalInDays)
      expect(daysBetween(NOW, result.nextReviewDate)).toBe(intervalInDays)
    }
  })

  it('markiert eine Vokabel aus Phase 6 als gelernt', () => {
    const result = applyLeitnerAnswer({ currentBox: 6, isCorrect: true, now: NOW })

    expect(result.becameLearned).toBe(true)
    expect(result.newBox).toBe(LEITNER_LEARNED_BOX)
    expect(result.newPhase).toBe(6)
  })

  it('lässt eine bereits gelernte Vokabel gelernt', () => {
    const result = applyLeitnerAnswer({ currentBox: 7, isCorrect: true, now: NOW })

    expect(result.previousPhase).toBe(6)
    expect(result.newBox).toBe(LEITNER_LEARNED_BOX)
    expect(result.becameLearned).toBe(true)
  })
})

describe('applyLeitnerAnswer – falsche Antwort', () => {
  it('rutscht exakt eine Phase zurück', () => {
    for (const phase of [2, 3, 4, 5, 6]) {
      const result = applyLeitnerAnswer({ currentBox: phase, isCorrect: false, now: NOW })

      expect(result.previousPhase).toBe(phase)
      expect(result.newPhase).toBe(phase - 1)
      expect(result.newBox).toBe(phase - 1)
      expect(result.movedBack).toBe(true)
      expect(result.becameLearned).toBe(false)
    }
  })

  it('bleibt in Phase 1 stehen und löscht den Fortschritt nicht', () => {
    const result = applyLeitnerAnswer({ currentBox: 1, isCorrect: false, now: NOW })

    expect(result.newBox).toBe(1)
    expect(result.newPhase).toBe(1)
    expect(result.intervalInDays).toBe(1)
    expect(daysBetween(NOW, result.nextReviewDate)).toBe(1)
  })

  it('holt eine gelernte Vokabel zurück in Phase 5', () => {
    const result = applyLeitnerAnswer({ currentBox: 7, isCorrect: false, now: NOW })

    expect(result.previousPhase).toBe(6)
    expect(result.newBox).toBe(5)
    expect(result.movedBack).toBe(true)
    expect(result.intervalInDays).toBe(29)
  })

  it('legt die Wiederholung nie in die Vergangenheit', () => {
    const result = applyLeitnerAnswer({ currentBox: 4, isCorrect: false, now: NOW })

    expect(result.nextReviewDate.getTime()).toBeGreaterThan(NOW.getTime())
  })
})

describe('Fortschrittsanzeige und Migration', () => {
  it('rechnet den Phasenfortschritt ruhig hoch', () => {
    expect(phaseProgressPercent(1)).toBe(0)
    expect(phaseProgressPercent(4)).toBe(50)
    expect(phaseProgressPercent(7)).toBe(100)
  })

  it('berechnet Wiederholungstermine für Altbestände', () => {
    expect(daysBetween(NOW, nextReviewDateForBox(3, false, NOW))).toBe(3)
    expect(daysBetween(NOW, nextReviewDateForBox(7, false, NOW))).toBe(90)
    expect(daysBetween(NOW, nextReviewDateForBox(null, false, NOW))).toBe(1)
  })
})
