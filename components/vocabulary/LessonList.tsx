'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ListChecks, ListPlus } from 'lucide-react'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import type { LessonStat } from '@/lib/types/vocabulary'
import LessonCardsModal from '@/components/vocabulary/LessonCardsModal'

interface LessonListProps {
  stats: LessonStat[]
  lang: string
  level: string
  translations?: VocabularyTranslations
}

/**
 * Interaktive Lektionsliste: Detailansicht je Lektion (als Modal, mit
 * Phasen-Anzeige pro Vokabel) sowie manuelle Übernahme einzelner Vokabeln
 * oder ganzer Lektionen (über den Einstufungs-Durchlauf `/vocabulary/assess`).
 *
 * Bewusst KEIN Akkordeon: Ein inline aufklappender Bereich zieht diese
 * Übersichtsseite bei vielen Vokabeln endlos lang. Die Detailliste öffnet
 * daher als `LessonCardsModal` (Tabs Wörterliste / Phasen-Verteilung) mit
 * begrenzter Höhe und eigenem internem Scrollbereich.
 */
export default function LessonList({ stats, lang, level, translations = {} }: LessonListProps) {
  const router = useRouter()
  const t = useMemo(() => createVocabularyTranslator(translations), [translations])
  const levelSegment = encodeURIComponent(level)
  const overviewBase = `/${lang}/dashboard/level/${levelSegment}/vocabulary`

  const [openLesson, setOpenLesson] = useState<string | null>(null)

  const handleCardAdded = useCallback(() => {
    router.refresh()
  }, [router])

  if (stats.length === 0) return null

  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const learnedPercent = stat.total > 0 ? Math.round((stat.learned / stat.total) * 100) : 0
        const hasProgress = stat.active > 0 || stat.learned > 0
        const assessHref = `${overviewBase}/assess?lesson=${encodeURIComponent(stat.lesson)}`

        return (
          <div
            key={stat.lesson}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{stat.lesson}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-lg text-gray-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" aria-hidden="true" />
                    {stat.active} {t('in_training')}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
                    {stat.learned} {t('learned')}
                  </span>
                  {stat.due > 0 && (
                    <span className="inline-flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <span className="h-3 w-3 rounded-full bg-amber-500" aria-hidden="true" />
                      {stat.due} {t('due_now')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-300" aria-hidden="true" />
                    {stat.total} {t('total')}
                  </span>
                </div>

                {/*
                  Fortschrittsbalken nur ab dem ersten gelernten Wort zeigen:
                  Bei 0% wirkte er (egal ob in der Button-Reihe oder darunter)
                  wie ein leerer, unfertiger Lade-Platzhalter. Sobald etwas
                  gelernt wurde, steht er dezent unterhalb der Textinfos.
                */}
                {stat.learned > 0 && (
                  <div className="mt-3 flex max-w-xs items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                      role="progressbar"
                      aria-valuenow={learnedPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t('learned')}
                    >
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${learnedPercent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-500 dark:text-slate-400">
                      {learnedPercent}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:shrink-0">
                {stat.untouched > 0 && (
                  <Link
                    href={assessHref}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-lg font-bold text-white shadow-sm transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                  >
                    <ListChecks size={22} aria-hidden="true" />
                    {hasProgress ? t('continue_assessing') : t('assess_set')}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setOpenLesson(stat.lesson)}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 bg-white px-6 py-3 text-lg font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <ListPlus size={22} aria-hidden="true" />
                  {t('show_cards')}
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {openLesson && (
        <LessonCardsModal
          lesson={openLesson}
          level={level}
          translations={translations}
          onClose={() => setOpenLesson(null)}
          onCardAdded={handleCardAdded}
        />
      )}
    </div>
  )
}
