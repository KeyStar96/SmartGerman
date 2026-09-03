'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, Check, CloudOff, PartyPopper } from 'lucide-react'
import { submitLessonAssessment } from '@/app/actions/vocabulary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import { articleColorClass } from '@/lib/vocabulary-ui'
import type { LessonCardView } from '@/lib/types/vocabulary'
import { cn } from '@/lib/utils'

interface LessonAssessmentClientProps {
  cards: LessonCardView[]
  lessonName: string
  lang: string
  level: string
  translations?: VocabularyTranslations
}

/**
 * Einstufungs-Durchlauf (Pre-Assessment) vor der Übernahme einer Lektion:
 * Der Lernende entscheidet Vokabel für Vokabel, ob sie schon bekannt ist
 * (→ direkt Phase 6 / gelernt) oder neu gelernt werden soll (→ Phase 1).
 * Jede Entscheidung wird sofort gespeichert, damit ein Abbruch mittendrin
 * keinen Fortschritt kostet.
 */
export default function LessonAssessmentClient({
  cards,
  lessonName,
  lang,
  level,
  translations = {},
}: LessonAssessmentClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [knownCount, setKnownCount] = useState(0)
  const [newCount, setNewCount] = useState(0)

  const t = useMemo(() => createVocabularyTranslator(translations), [translations])
  const overviewHref = `/${lang}/dashboard/level/${encodeURIComponent(level)}/vocabulary`
  const trainHref = `${overviewHref}/train`
  const currentCard = cards[currentIndex]

  const handleDecision = useCallback(
    async (alreadyKnown: boolean): Promise<void> => {
      if (!currentCard || isSubmitting) return
      setIsSubmitting(true)
      setSaveFailed(false)

      try {
        const result = await submitLessonAssessment([{ cardId: currentCard.id, alreadyKnown }])

        if (!result.success) {
          setSaveFailed(true)
          return
        }

        if (alreadyKnown) {
          setKnownCount((count) => count + 1)
        } else {
          setNewCount((count) => count + 1)
        }
        setCurrentIndex((index) => index + 1)
      } catch (err) {
        console.error(`Einstufung für Vokabel ${currentCard.id} konnte nicht gespeichert werden:`, err)
        setSaveFailed(true)
      } finally {
        setIsSubmitting(false)
      }
    },
    [currentCard, isSubmitting]
  )

  if (!currentCard) {
    return (
      <div className="mx-auto mt-2 max-w-2xl rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <PartyPopper className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-bold text-green-900">{t('assess_done_title')}</h2>
        <p className="mt-3 text-xl text-green-800">
          {t('assess_done_summary', { known: knownCount, new: newCount })}
        </p>
        <p className="mt-2 text-lg text-green-800/80">{t('assess_done_hint')}</p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          {newCount > 0 && (
            <Link
              href={trainHref}
              className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              {t('go_to_training')}
            </Link>
          )}
          <Link
            href={overviewHref}
            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-green-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
          >
            {t('back_to_overview')}
          </Link>
        </div>
      </div>
    )
  }

  const displayWord =
    currentCard.article && currentCard.article !== 'none'
      ? `${currentCard.article} ${currentCard.word_de}`
      : currentCard.word_de

  return (
    <div className="mx-auto mt-2 max-w-2xl">
      <div className="mb-6 flex flex-col gap-3 text-lg font-medium text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{t('lesson_label', { lesson: lessonName })}</span>
        <span>{t('card_progress', { current: currentIndex + 1, total: cards.length })}</span>
      </div>

      <div className="flex min-h-[20rem] flex-col items-center justify-center overflow-hidden rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-gray-900/10 sm:p-10">
        <span
          className={cn('break-words text-3xl font-extrabold sm:text-5xl', articleColorClass(currentCard.article))}
        >
          {displayWord}
        </span>

        {currentCard.plural && (
          <p className="mt-3 text-2xl text-gray-500">{t('plural_label', { plural: currentCard.plural })}</p>
        )}

        <p className="mt-6 break-words text-2xl text-gray-700">{currentCard.translation || t('no_translation')}</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
        <button
          type="button"
          onClick={() => void handleDecision(true)}
          disabled={isSubmitting}
          className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-green-300 bg-green-50 py-6 text-green-800 transition-colors hover:bg-green-100 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
        >
          <Check size={36} className="mb-2" aria-hidden="true" />
          <span className="text-xl font-bold">{t('already_know')}</span>
          <span className="mt-1 text-base opacity-90">{t('already_know_hint')}</span>
        </button>

        <button
          type="button"
          onClick={() => void handleDecision(false)}
          disabled={isSubmitting}
          className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-blue-300 bg-blue-50 py-6 text-blue-800 transition-colors hover:bg-blue-100 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
        >
          <BookmarkPlus size={36} className="mb-2" aria-hidden="true" />
          <span className="text-xl font-bold">{t('add_to_box')}</span>
          <span className="mt-1 text-base opacity-90">{t('add_to_box_hint')}</span>
        </button>
      </div>

      {saveFailed && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4"
        >
          <CloudOff className="h-6 w-6 shrink-0 text-gray-500" aria-hidden="true" />
          <p className="text-lg text-gray-600">{t('assess_save_failed')}</p>
        </div>
      )}
    </div>
  )
}
