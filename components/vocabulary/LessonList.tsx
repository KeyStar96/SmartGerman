'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, CloudOff, ListChecks, Loader2, Plus } from 'lucide-react'
import { addCardsToTrainer, getLessonCards } from '@/app/actions/vocabulary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import { articleColorClass, phaseBadgeClasses } from '@/lib/vocabulary-ui'
import type { LessonCardView, LessonStat } from '@/lib/types/vocabulary'
import { cn } from '@/lib/utils'

interface LessonListProps {
  stats: LessonStat[]
  lang: string
  level: string
  translations?: VocabularyTranslations
}

type CardsState = 'loading' | 'error' | LessonCardView[]

/**
 * Interaktive Lektionsliste: Detailansicht je Lektion (aufklappbar, mit
 * Phasen-Anzeige pro Vokabel) sowie manuelle Übernahme einzelner Vokabeln
 * oder ganzer Lektionen (über den Einstufungs-Durchlauf `/vocabulary/assess`).
 */
export default function LessonList({ stats, lang, level, translations = {} }: LessonListProps) {
  const router = useRouter()
  const t = useMemo(() => createVocabularyTranslator(translations), [translations])
  const levelSegment = encodeURIComponent(level)
  const overviewBase = `/${lang}/dashboard/level/${levelSegment}/vocabulary`

  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [cardsByLesson, setCardsByLesson] = useState<Record<string, CardsState>>({})
  const [pendingCardId, setPendingCardId] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const loadLessonCards = useCallback(
    async (lesson: string) => {
      setCardsByLesson((prev) => ({ ...prev, [lesson]: 'loading' }))
      try {
        const cards = await getLessonCards(lesson, level)
        setCardsByLesson((prev) => ({ ...prev, [lesson]: cards }))
      } catch (err) {
        console.error(`Vokabeln der Lektion "${lesson}" konnten nicht geladen werden:`, err)
        setCardsByLesson((prev) => ({ ...prev, [lesson]: 'error' }))
      }
    },
    [level]
  )

  const handleToggle = useCallback(
    (lesson: string) => {
      if (expandedLesson === lesson) {
        setExpandedLesson(null)
        return
      }
      setExpandedLesson(lesson)
      setAddError(null)
      if (!cardsByLesson[lesson]) {
        void loadLessonCards(lesson)
      }
    },
    [expandedLesson, cardsByLesson, loadLessonCards]
  )

  const handleAddSingleCard = useCallback(
    async (lesson: string, cardId: string) => {
      setPendingCardId(cardId)
      setAddError(null)
      try {
        const result = await addCardsToTrainer([cardId])
        if (!result.success) {
          setAddError(lesson)
          return
        }
        // Lokal aktualisieren: Karte startet in Phase 1, keine Neuladung nötig.
        setCardsByLesson((prev) => {
          const current = prev[lesson]
          if (!Array.isArray(current)) return prev
          return {
            ...prev,
            [lesson]: current.map((card) =>
              card.id === cardId ? { ...card, phase: 1, isLearned: false } : card
            ),
          }
        })
        router.refresh()
      } catch (err) {
        console.error(`Vokabel ${cardId} konnte nicht manuell übernommen werden:`, err)
        setAddError(lesson)
      } finally {
        setPendingCardId(null)
      }
    },
    [router]
  )

  if (stats.length === 0) return null

  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const learnedPercent = stat.total > 0 ? Math.round((stat.learned / stat.total) * 100) : 0
        const hasProgress = stat.active > 0 || stat.learned > 0
        const isExpanded = expandedLesson === stat.lesson
        const cardsState = cardsByLesson[stat.lesson]
        const assessHref = `${overviewBase}/assess?lesson=${encodeURIComponent(stat.lesson)}`

        return (
          <div
            key={stat.lesson}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-gray-900">{stat.lesson}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-lg text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" aria-hidden="true" />
                    {stat.active} {t('in_training')}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
                    {stat.learned} {t('learned')}
                  </span>
                  {stat.due > 0 && (
                    <span className="inline-flex items-center gap-2 font-bold text-amber-700">
                      <span className="h-3 w-3 rounded-full bg-amber-500" aria-hidden="true" />
                      {stat.due} {t('due_now')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-300" aria-hidden="true" />
                    {stat.total} {t('total')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                {hasProgress && (
                  <div
                    className="h-4 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner sm:w-40"
                    role="progressbar"
                    aria-valuenow={learnedPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('learned')}
                  >
                    <div
                      className="h-4 rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${learnedPercent}%` }}
                    />
                  </div>
                )}

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
                  onClick={() => handleToggle(stat.lesson)}
                  aria-expanded={isExpanded}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 bg-white px-6 py-3 text-lg font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                >
                  <ChevronDown
                    size={22}
                    aria-hidden="true"
                    className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
                  />
                  {isExpanded ? t('hide_cards') : t('show_cards')}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 p-6">
                {cardsState === 'loading' && (
                  <p className="flex items-center gap-3 text-lg text-gray-600">
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    {t('cards_loading')}
                  </p>
                )}

                {cardsState === 'error' && (
                  <p className="flex items-center gap-3 text-lg text-gray-600">
                    <CloudOff className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {t('cards_load_failed')}
                  </p>
                )}

                {Array.isArray(cardsState) && (
                  <ul className="space-y-3">
                    {cardsState.map((card) => {
                      const displayWord =
                        card.article && card.article !== 'none' ? `${card.article} ${card.word_de}` : card.word_de
                      const isPending = pendingCardId === card.id

                      return (
                        <li
                          key={card.id}
                          className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className={cn('break-words text-lg font-bold', articleColorClass(card.article))}>
                              {displayWord}
                            </p>
                            <p className="break-words text-base text-gray-600">
                              {card.translation || t('no_translation')}
                            </p>
                          </div>

                          {card.phase === null ? (
                            <button
                              type="button"
                              onClick={() => void handleAddSingleCard(stat.lesson, card.id)}
                              disabled={isPending}
                              aria-label={t('add_single_card_aria', { word: card.word_de })}
                              className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                            >
                              {isPending ? (
                                <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                              ) : (
                                <Plus size={20} aria-hidden="true" />
                              )}
                              {t('add_single_card')}
                            </button>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex min-h-12 shrink-0 items-center justify-center rounded-full px-5 text-base font-bold',
                                phaseBadgeClasses(card.phase, card.isLearned)
                              )}
                            >
                              {card.isLearned ? t('phase_badge_learned') : t('phase_badge', { phase: card.phase })}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {addError === stat.lesson && (
                  <p role="status" aria-live="polite" className="mt-4 text-lg font-medium text-amber-700">
                    {t('manual_add_failed')}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
