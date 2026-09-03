'use client'

import { useCallback, useEffect, useState } from 'react'
import { CloudOff, Loader2, Plus, X } from 'lucide-react'
import { addCardsToTrainer, getLessonCards } from '@/app/actions/vocabulary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import { articleColorClass, phaseBadgeClasses } from '@/lib/vocabulary-ui'
import type { LessonCardView } from '@/lib/types/vocabulary'
import { cn } from '@/lib/utils'

type CardsState = 'loading' | 'error' | LessonCardView[]

/**
 * Vokabelliste einer Lektion als Overlay statt Akkordeon.
 *
 * Grund: Ein aufklappender Bereich direkt in der Lektionsliste zieht die
 * Übersichtsseite bei vielen Vokabeln endlos lang. Das Modal hat stattdessen
 * eine auf `max-h-[80vh]` begrenzte Gesamthöhe; der Wörterliste-Body bekommt
 * explizit `overflow-y-auto`, damit auf dem MacBook-Trackpad/Mausrad flüssig
 * gescrollt werden kann, ohne dass das Modal selbst über den Viewport wächst.
 */
export default function LessonCardsModal({
  lesson,
  level,
  translations = {},
  onClose,
  onCardAdded,
}: {
  lesson: string
  level: string
  translations?: VocabularyTranslations
  onClose: () => void
  /** Wird nach erfolgreicher manueller Übernahme aufgerufen, damit die Lektionsliste dahinter aktualisiert. */
  onCardAdded: () => void
}) {
  const t = createVocabularyTranslator(translations)
  const [cardsState, setCardsState] = useState<CardsState>('loading')
  const [pendingCardId, setPendingCardId] = useState<string | null>(null)
  const [addFailed, setAddFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCardsState('loading')

    void getLessonCards(lesson, level)
      .then((cards) => {
        if (!cancelled) setCardsState(cards)
      })
      .catch((err) => {
        console.error(`Vokabeln der Lektion "${lesson}" konnten nicht geladen werden:`, err)
        if (!cancelled) setCardsState('error')
      })

    return () => {
      cancelled = true
    }
  }, [lesson, level])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAddSingleCard = useCallback(
    async (cardId: string) => {
      setPendingCardId(cardId)
      setAddFailed(false)
      try {
        const result = await addCardsToTrainer([cardId])
        if (!result.success) {
          setAddFailed(true)
          return
        }
        setCardsState((prev) =>
          Array.isArray(prev)
            ? prev.map((card) => (card.id === cardId ? { ...card, phase: 1, isLearned: false } : card))
            : prev
        )
        onCardAdded()
      } catch (err) {
        console.error(`Vokabel ${cardId} konnte nicht manuell übernommen werden:`, err)
        setAddFailed(true)
      } finally {
        setPendingCardId(null)
      }
    },
    [onCardAdded]
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lesson}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-100 p-5 dark:border-slate-800">
          <h3 className="min-w-0 truncate text-xl font-bold text-gray-900 dark:text-slate-100">{lesson}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close_cards')}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Body: explizit overflow-y-auto, damit die Wörterliste unabhängig von ihrer Länge flüssig scrollt und das max-h-[80vh]-Modal nicht sprengt. */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {cardsState === 'loading' && (
            <p className="flex items-center gap-3 text-lg text-gray-600 dark:text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              {t('cards_loading')}
            </p>
          )}

          {cardsState === 'error' && (
            <p className="flex items-center gap-3 text-lg text-gray-600 dark:text-slate-400">
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
                    className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 shadow-sm ring-1 ring-gray-900/5 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800 dark:ring-slate-700"
                  >
                    <div className="min-w-0">
                      <p className={cn('break-words text-lg font-bold', articleColorClass(card.article))}>
                        {displayWord}
                      </p>
                      <p className="break-words text-base text-gray-600 dark:text-slate-400">
                        {card.translation || t('no_translation')}
                      </p>
                    </div>

                    {card.phase === null ? (
                      <button
                        type="button"
                        onClick={() => void handleAddSingleCard(card.id)}
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

          {addFailed && (
            <p role="status" aria-live="polite" className="mt-4 text-lg font-medium text-amber-700 dark:text-amber-400">
              {t('manual_add_failed')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
