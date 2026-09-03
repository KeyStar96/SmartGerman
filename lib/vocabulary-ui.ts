import { LEITNER_PHASES, type LeitnerPhase } from '@/lib/leitner'

/**
 * Artikel-Farben als zusätzliche visuelle Merkhilfe für das Genus.
 * Zentral hier hinterlegt, damit Trainer, Detailansicht und Einstufung
 * dieselbe Zuordnung verwenden.
 */
export function articleColorClass(article: string | null): string {
  switch (article) {
    case 'der':
      return 'text-blue-700'
    case 'die':
      return 'text-red-700'
    case 'das':
      return 'text-green-700'
    default:
      return 'text-gray-900'
  }
}

/**
 * Farbliche Einstufung des Phasen-Badges in der Lektions-Detailansicht:
 * Von Amber (frisch, Phase 1–2) über Blau (Phase 3–4) bis Grün (Phase 5–6),
 * „gelernt" erhält eine eigene, kräftigere Grün-Variante.
 */
export function phaseBadgeClasses(phase: LeitnerPhase | null, isLearned: boolean): string {
  if (isLearned) return 'bg-green-600 text-white'
  if (phase === null) return 'bg-gray-100 text-gray-500'
  if (phase <= 2) return 'bg-amber-100 text-amber-900'
  if (phase <= 4) return 'bg-blue-100 text-blue-900'
  return 'bg-green-100 text-green-900'
}

export type PhaseBucketKey = LeitnerPhase | 'learned'

export interface PhaseCountCard {
  phase: LeitnerPhase | null
  isLearned: boolean
}

export interface PhaseBucket {
  key: PhaseBucketKey
  count: number
}

export interface PhaseDistribution {
  buckets: PhaseBucket[]
  /** Karten in Phase 1–6 oder „gelernt" (ohne noch nicht übernommene). */
  totalInBox: number
  /** Alle Karten der Lektion inklusive unberührter und eigener. */
  totalCards: number
  /**
   * Gewichteter Fortschritt: unberührt = 0, Phase n = n/7, gelernt = 7/7.
   * Eigene Vokabeln (Phase 1) fließen mit ein.
   */
  overallPercent: number
}

/**
 * Zählt, wie viele Vokabeln in welcher Leitner-Phase stecken.
 * Unberührte Karten (`phase === null`) erscheinen in keinem Balken, senken
 * aber den Gesamtfortschritt, weil sie zur Lektion gehören.
 */
export function computePhaseDistribution(cards: readonly PhaseCountCard[]): PhaseDistribution {
  const counts: Record<LeitnerPhase, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  let learned = 0
  let score = 0

  for (const card of cards) {
    if (card.isLearned) {
      learned += 1
      score += 7
    } else if (card.phase !== null) {
      counts[card.phase] += 1
      score += card.phase
    }
  }

  const totalCards = cards.length
  const totalInBox = LEITNER_PHASES.reduce((sum, phase) => sum + counts[phase], 0) + learned

  return {
    buckets: [
      ...LEITNER_PHASES.map((phase) => ({ key: phase as PhaseBucketKey, count: counts[phase] })),
      { key: 'learned', count: learned },
    ],
    totalInBox,
    totalCards,
    overallPercent: totalCards === 0 ? 0 : Math.round((score / (totalCards * 7)) * 100),
  }
}

/** Balken- und Label-Farben: Amber/Orange (Phase 1) bis Grün (Phase 6 / gelernt). */
export function phaseBarClasses(key: PhaseBucketKey): { bar: string; label: string } {
  switch (key) {
    case 1:
      return { bar: 'bg-amber-400', label: 'text-amber-800 dark:text-amber-300' }
    case 2:
      return { bar: 'bg-orange-400', label: 'text-orange-800 dark:text-orange-300' }
    case 3:
      return { bar: 'bg-[#FF5C00]', label: 'text-[#CC4700] dark:text-orange-300' }
    case 4:
      return { bar: 'bg-blue-500', label: 'text-blue-800 dark:text-blue-300' }
    case 5:
      return { bar: 'bg-emerald-500', label: 'text-emerald-800 dark:text-emerald-300' }
    case 6:
      return { bar: 'bg-green-600', label: 'text-green-800 dark:text-green-300' }
    case 'learned':
      return { bar: 'bg-green-700', label: 'text-green-900 dark:text-green-200' }
  }
}
