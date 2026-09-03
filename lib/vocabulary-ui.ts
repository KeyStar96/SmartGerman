import type { LeitnerPhase } from '@/lib/leitner'

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
