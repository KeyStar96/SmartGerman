'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, CloudOff, Image as ImageIcon, Layers, PartyPopper, X } from 'lucide-react'
import SolutionAudioButton from '@/components/exercises/SolutionAudioButton'
import { finishVocabularySession, submitVocabularyAnswer } from '@/app/actions/vocabulary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import { articleColorClass } from '@/lib/vocabulary-ui'
import type { LeitnerPhase } from '@/lib/leitner'
import type { DueVocabularyCard } from '@/lib/types/vocabulary'
import { cn, stripLessonPrefix } from '@/lib/utils'

interface AnswerFeedback {
  phase: LeitnerPhase
  intervalInDays: number
  movedBack: boolean
  becameLearned: boolean
}

interface VocabTrainerClientProps {
  initialCards: DueVocabularyCard[]
  translations?: VocabularyTranslations
  lang: string
  level: string
}

export default function VocabTrainerClient({
  initialCards,
  translations = {},
  lang,
  level,
}: VocabTrainerClientProps) {
  /** Snapshot, damit ein Server-Refresh die laufende Session nicht umsortiert. */
  const [session] = useState<DueVocabularyCard[]>(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)

  const t = useMemo(() => createVocabularyTranslator(translations), [translations])
  const currentCard = session[currentIndex]
  const overviewHref = `/${lang}/dashboard/level/${encodeURIComponent(level)}/vocabulary`

  const handleAnswer = useCallback(
    async (isCorrect: boolean): Promise<void> => {
      if (isSubmitting || !currentCard) return
      setIsSubmitting(true)
      setSaveFailed(false)

      try {
        const result = await submitVocabularyAnswer({
          progressId: currentCard.progressId,
          isCorrect,
        })

        if (!result.success || result.newPhase === undefined) {
          setSaveFailed(true)
          setIsSubmitting(false)
          return
        }

        setFeedback({
          phase: result.newPhase,
          intervalInDays: result.intervalInDays ?? 1,
          movedBack: result.movedBack ?? false,
          becameLearned: result.becameLearned ?? false,
        })
      } catch (err) {
        console.error('Antwort konnte nicht gespeichert werden:', err)
        setSaveFailed(true)
      } finally {
        setIsSubmitting(false)
      }
    },
    [currentCard, isSubmitting]
  )

  const handleNext = useCallback((): void => {
    const nextIndex = currentIndex + 1
    setFeedback(null)
    setIsRevealed(false)
    setCurrentIndex(nextIndex)

    if (nextIndex >= session.length) {
      void finishVocabularySession().catch(() => {
        // Die Übersicht aktualisiert sich dann beim nächsten Seitenaufruf.
      })
    }
  }, [currentIndex, session.length])

  if (session.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-900/5 sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Check className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{t('nothing_due_title')}</h2>
        <p className="mt-3 text-xl text-gray-600">{t('nothing_due_text')}</p>
        <Link
          href={overviewHref}
          className="mt-8 inline-flex min-h-16 items-center rounded-2xl bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-blue-500"
        >
          {t('back_to_overview')}
        </Link>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <PartyPopper className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-bold text-green-900">{t('session_done_title')}</h2>
        <p className="mt-3 text-xl text-green-800">{t('session_done_text')}</p>
        <Link
          href={overviewHref}
          className="mt-8 inline-flex min-h-16 items-center rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-green-600"
        >
          {t('back_to_overview')}
        </Link>
      </div>
    )
  }

  const { card } = currentCard
  const displayWord = card.article && card.article !== 'none' ? `${card.article} ${card.word_de}` : card.word_de

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex flex-col gap-3 text-lg font-medium text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span>{t('lesson_label', { lesson: stripLessonPrefix(card.lesson) })}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-800">
          <Layers size={20} aria-hidden="true" />
          {t('phase_label', { phase: currentCard.phase })}
        </span>
        <span>{t('card_progress', { current: currentIndex + 1, total: session.length })}</span>
      </div>

      {/* Kompakte Karte: kleinere Innenabstände als früher, damit sie auf Laptop-Displays (13"/14") möglichst ohne Scrollen komplett sichtbar ist. Wird sie trotzdem zu groß, scrollt die Seite jetzt einfach natürlich statt abzuschneiden. */}
      <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-900/10">
        {/* Vorderseite: Muttersprache */}
        <div className="flex flex-col items-center justify-center border-b border-gray-100 bg-gray-50 p-5 sm:p-8">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={t('image_alt')}
              className="mb-4 h-28 w-28 max-w-full rounded-2xl object-cover shadow-md sm:mb-6 sm:h-36 sm:w-36"
            />
          ) : (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-200 text-gray-400 shadow-inner sm:mb-6 sm:h-24 sm:w-24">
              <ImageIcon size={40} aria-hidden="true" />
            </div>
          )}

          <h2 className="break-words text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            {currentCard.translation || t('no_translation')}
          </h2>
        </div>

        {isRevealed ? (
          <div className="flex flex-col items-center justify-center bg-white p-5 sm:p-8">
            <span className={cn('break-words text-center text-2xl font-extrabold sm:text-4xl', articleColorClass(card.article))}>
              {displayWord}
            </span>

            {card.plural && (
              <p className="mt-2 text-xl text-gray-500">{t('plural_label', { plural: card.plural })}</p>
            )}

            <div className="mt-4">
              <SolutionAudioButton
                text={displayWord}
                audioUrl={card.audio_url}
                label={t('listen_word')}
                ariaLabel={t('listen_word_aria', { word: card.word_de })}
                variant="secondary"
              />
            </div>

            {feedback ? (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  'mt-6 w-full rounded-2xl border-2 p-5 text-center',
                  feedback.movedBack
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-green-200 bg-green-50 text-green-900'
                )}
              >
                <p className="text-xl font-bold">
                  {feedback.becameLearned
                    ? t('became_learned')
                    : feedback.movedBack
                      ? t('moved_back', { phase: feedback.phase })
                      : feedback.intervalInDays <= 1
                        ? t('moved_forward_tomorrow', { phase: feedback.phase })
                        : t('moved_forward', { phase: feedback.phase, days: feedback.intervalInDays })}
                </p>

                {/* Kein automatischer Kartenwechsel: Der Lernende bestimmt das Tempo. */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-4 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                >
                  {currentIndex + 1 >= session.length ? t('finish_session') : t('next_card')}
                  <ArrowRight size={28} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={() => void handleAnswer(false)}
                  disabled={isSubmitting}
                  className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-50 py-4 text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                >
                  <X size={30} className="mb-1" aria-hidden="true" />
                  <span className="text-xl font-bold">{t('didnt_know')}</span>
                  <span className="mt-1 text-base opacity-90">{t('didnt_know_hint')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleAnswer(true)}
                  disabled={isSubmitting}
                  className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-green-300 bg-green-50 py-4 text-green-800 transition-colors hover:bg-green-100 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                >
                  <Check size={30} className="mb-1" aria-hidden="true" />
                  <span className="text-xl font-bold">{t('knew_it')}</span>
                  <span className="mt-1 text-base opacity-90">{t('knew_it_hint')}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-white p-5 sm:p-8">
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="w-full rounded-2xl bg-blue-600 py-6 text-2xl font-bold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              {t('reveal_solution')}
            </button>
          </div>
        )}

        {saveFailed && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4"
          >
            <CloudOff className="h-6 w-6 shrink-0 text-gray-500" aria-hidden="true" />
            <p className="text-lg text-gray-600">{t('save_failed')}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-lg text-gray-500">{t('phase_explanation')}</p>
      <div className="mt-3 text-center">
        <Link
          href={overviewHref}
          className="inline-flex min-h-12 items-center text-lg font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          {t('add_more_vocabulary')}
        </Link>
      </div>
    </div>
  )
}
