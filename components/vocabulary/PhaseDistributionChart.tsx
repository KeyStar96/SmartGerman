'use client'

import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import {
  computePhaseDistribution,
  phaseBarClasses,
  type PhaseBucketKey,
  type PhaseCountCard,
} from '@/lib/vocabulary-ui'

interface PhaseDistributionChartProps {
  cards: readonly PhaseCountCard[]
  translations?: VocabularyTranslations
}

function bucketLabel(
  key: PhaseBucketKey,
  t: ReturnType<typeof createVocabularyTranslator>
): string {
  if (key === 'learned') return t('phase_chart_learned_label')
  return t('phase_chart_phase_label', { phase: key })
}

/**
 * Vertikales Balkendiagramm der Leitner-Phasen einer Lektion.
 * Reine Tailwind-Balken (kein Chart-Library), damit der Bundle klein bleibt
 * und die Geragogik-Schriftgrößen unangetastet bleiben.
 */
export default function PhaseDistributionChart({
  cards,
  translations = {},
}: PhaseDistributionChartProps) {
  const t = createVocabularyTranslator(translations)
  const distribution = computePhaseDistribution(cards)
  const maxCount = Math.max(1, ...distribution.buckets.map((bucket) => bucket.count))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
          {t('overall_progress_label')}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={distribution.overallPercent}
            aria-label={t('overall_progress_label')}
          >
            <div
              className="h-full rounded-full bg-green-600 transition-all duration-500"
              style={{ width: `${distribution.overallPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-xl font-extrabold tabular-nums text-gray-900 dark:text-slate-100">
            {distribution.overallPercent}%
          </span>
        </div>
      </div>

      {distribution.totalInBox === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-lg text-gray-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
          {t('phase_chart_empty')}
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto overscroll-contain">
          <div
            className="flex min-h-[18rem] min-w-[32rem] items-end gap-2 px-1 pb-2 sm:gap-3"
            role="img"
            aria-label={t('tab_phases')}
          >
            {distribution.buckets.map((bucket) => {
              const colors = phaseBarClasses(bucket.key)
              const heightPercent = Math.max(
                bucket.count === 0 ? 2 : 8,
                Math.round((bucket.count / maxCount) * 100)
              )
              const label = bucketLabel(bucket.key, t)
              const countText = t('phase_chart_bar_count', { count: bucket.count })

              return (
                <div key={String(bucket.key)} className="flex min-w-0 flex-1 flex-col items-center">
                  <p className="mb-2 min-h-12 text-center text-base font-bold leading-tight text-gray-800 dark:text-slate-200 sm:text-lg">
                    {countText}
                  </p>
                  <div className="flex h-44 w-full items-end justify-center">
                    <div
                      className={`w-full max-w-[3.5rem] rounded-t-2xl ${colors.bar} ${
                        bucket.count === 0 ? 'opacity-25' : 'shadow-sm'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <p
                    className={`mt-3 min-h-12 text-center text-base font-bold leading-tight sm:text-lg ${colors.label}`}
                  >
                    {label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
