'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, CloudOff, Image as ImageIcon, Layers, PartyPopper, X } from 'lucide-react'
import SolutionAudioButton from '@/components/exercises/SolutionAudioButton'
import { finishVocabularySession, submitVocabularyAnswer } from '@/app/actions/vocabulary'
import {
  createVocabularyTranslator,
  type VocabularyTranslations,
  type VocabularyTranslator,
} from '@/lib/vocabulary-i18n'
import { articleColorClass } from '@/lib/vocabulary-ui'
import type { DueVocabularyCard } from '@/lib/types/vocabulary'
import { cn, stripLessonPrefix } from '@/lib/utils'

interface VocabCardSessionProps {
  /** Bereits nach Lernkasten-Auswahl gefilterte, fällige Karten. */
  cards: DueVocabularyCard[]
  translations?: VocabularyTranslations
  overviewHref: string
  /** Zurück zur Lernkasten-Zusammenstellung. */
  onBackToLernkasten: () => void
}

/** Dauer der Exit-Animation. Danach wird sofort die vorgerenderte Karte aktiv. */
const EXIT_MS = 260

type ExitDirection = 'left' | 'right' | null

/** Deutsches Wort inkl. Artikel, wie es aufgedeckt angezeigt wird. */
function toDisplayWord(card: DueVocabularyCard['card']): string {
  return card.article && card.article !== 'none' ? `${card.article} ${card.word_de}` : card.word_de
}

/**
 * Vorderseite (Muttersprache + Bild). Wird sowohl für die aktive Karte als auch
 * für die vorgerenderte nächste Karte im Stapel verwendet – so ist das Bild der
 * Folgekarte bereits dekodiert, sobald sie aktiv wird.
 */
function CardFront({ item, t }: { item: DueVocabularyCard; t: VocabularyTranslator }) {
  const { card } = item
  return (
    <div className="flex flex-col items-center justify-center border-b border-gray-100 bg-gray-50 p-6 sm:p-8">
      {card.image_url ? (
        <img
          src={card.image_url}
          alt={t('image_alt')}
          decoding="async"
          className="mb-4 h-28 w-28 max-w-full rounded-2xl object-cover shadow-md sm:mb-6 sm:h-36 sm:w-36"
        />
      ) : (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-200 text-gray-400 shadow-inner sm:mb-6 sm:h-24 sm:w-24">
          <ImageIcon size={40} aria-hidden="true" />
        </div>
      )}

      <h2 className="break-words text-center text-2xl font-bold text-gray-800 sm:text-3xl">
        {item.translation || t('no_translation')}
      </h2>
    </div>
  )
}

export default function VocabCardSession({
  cards,
  translations = {},
  overviewHref,
  onBackToLernkasten,
}: VocabCardSessionProps) {
  /** Snapshot, damit ein Server-Refresh die laufende Session nicht umsortiert. */
  const [session] = useState<DueVocabularyCard[]>(cards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  /** Solange gesetzt, läuft die Exit-Animation der aktuellen Karte. */
  const [exitDirection, setExitDirection] = useState<ExitDirection>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = useMemo(() => createVocabularyTranslator(translations), [translations])
  const currentCard = session[currentIndex]
  const nextCard = session[currentIndex + 1]

  /**
   * Pre-Rendering-Absicherung: Bilder der nächsten beiden Karten vorab in den
   * Browser-Cache holen, damit beim Kartenwechsel keine Ladezeit entsteht.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    for (const offset of [1, 2]) {
      const url = session[currentIndex + offset]?.card.image_url
      if (url) {
        const preload = new window.Image()
        preload.decoding = 'async'
        preload.src = url
      }
    }
  }, [currentIndex, session])

  /** Aufräumen: laufenden Exit-Timer beim Unmount stoppen. */
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  const handleAnswer = useCallback(
    (isCorrect: boolean): void => {
      // Während einer laufenden Transition keine weitere Antwort annehmen.
      if (exitDirection !== null || !currentCard) return

      const nextIndex = currentIndex + 1

      // Speichern läuft im Hintergrund (fire-and-forget) – der Kartenwechsel
      // wartet bewusst NICHT darauf, damit er sofort erfolgt.
      setSaveFailed(false)
      void submitVocabularyAnswer({ progressId: currentCard.progressId, isCorrect })
        .then((result) => {
          if (!result.success) setSaveFailed(true)
        })
        .catch((err) => {
          console.error('Antwort konnte nicht gespeichert werden:', err)
          setSaveFailed(true)
        })

      // Sofortige, flüssige Exit-Bewegung: „Wusste ich" nach rechts, sonst links.
      setExitDirection(isCorrect ? 'right' : 'left')

      exitTimerRef.current = setTimeout(() => {
        setCurrentIndex(nextIndex)
        setIsRevealed(false)
        setExitDirection(null)

        if (nextIndex >= session.length) {
          void finishVocabularySession().catch(() => {
            // Die Übersicht aktualisiert sich dann beim nächsten Seitenaufruf.
          })
        }
      }, EXIT_MS)
    },
    [currentCard, currentIndex, exitDirection, session.length]
  )

  if (!currentCard) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <PartyPopper className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-bold text-green-900">{t('session_done_title')}</h2>
        <p className="mt-3 text-xl text-green-800">{t('session_done_text')}</p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onBackToLernkasten}
            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-green-700 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-green-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
          >
            {t('lernkasten_back')}
          </button>
          <Link
            href={overviewHref}
            className="inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-green-300 bg-white px-8 py-4 text-xl font-bold text-green-800 shadow-sm transition-colors hover:bg-green-50"
          >
            {t('back_to_overview')}
          </Link>
        </div>
      </div>
    )
  }

  const displayWord = toDisplayWord(currentCard.card)
  const isExiting = exitDirection !== null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4">
        <button
          type="button"
          onClick={onBackToLernkasten}
          className="inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
        >
          <ArrowLeft size={22} aria-hidden="true" /> {t('lernkasten_back')}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 text-lg font-medium text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span>{t('lesson_label', { lesson: stripLessonPrefix(currentCard.card.lesson) })}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-800">
          <Layers size={20} aria-hidden="true" />
          {t('phase_label', { phase: currentCard.phase })}
        </span>
        <span>{t('card_progress', { current: currentIndex + 1, total: session.length })}</span>
      </div>

      {/*
        Tinder-Stapel: aktuelle Karte (i) und bereits fertig gerenderte
        Folgekarte (i+1) liegen per CSS-Grid in derselben Zelle übereinander.
        Beim Antworten fliegt NUR die aktive Karte weich zur Seite; die dahinter
        liegende Karte bleibt an ihrer festen Position und wird ohne Ladezeit
        und ohne Einflieg-Bewegung sofort zur neuen aktiven Karte.

        Wichtig: Beide Slots sind per `key` an die `progressId` gebunden. Dadurch
        mountet React beim Kartenwechsel jeweils einen FRISCHEN Knoten – der
        obere Knoten kann so nicht aus seiner Fly-Out-Position „zurückfliegen"
        (das war die störende Einflieg-Animation), und die nachrückende Karte
        erscheint stabil an ihrer Position statt zu springen.
      */}
      <div className="grid">
        {nextCard && (
          <div
            key={nextCard.progressId}
            aria-hidden="true"
            className={cn(
              // Nur Skalierung/Opacity, KEINE Richtungs-Verschiebung (kein translateX/Y).
              'z-0 self-start [grid-area:1/1] transition-[transform,opacity] duration-[260ms] ease-out motion-reduce:transition-none',
              isExiting ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-90'
            )}
          >
            <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-900/10">
              <CardFront item={nextCard} t={t} />
              <div className="flex items-center justify-center bg-white p-6 sm:p-8">
                <div className="w-full rounded-2xl bg-blue-600 py-6 text-center text-2xl font-bold text-white shadow-md">
                  {t('reveal_solution')}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          key={currentCard.progressId}
          className={cn(
            'z-10 self-start [grid-area:1/1] transition-all duration-[260ms] ease-in will-change-transform motion-reduce:transition-none',
            exitDirection === 'right' && 'translate-x-[130%] rotate-[8deg] opacity-0',
            exitDirection === 'left' && '-translate-x-[130%] -rotate-[8deg] opacity-0'
          )}
        >
          <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-900/10">
            <CardFront item={currentCard} t={t} />

            {isRevealed ? (
              <div className="flex flex-col items-center justify-center bg-white p-6 sm:p-8">
                <span
                  className={cn(
                    'break-words text-center text-2xl font-extrabold sm:text-4xl',
                    articleColorClass(currentCard.card.article)
                  )}
                >
                  {displayWord}
                </span>

                {currentCard.card.plural && (
                  <p className="mt-2 text-xl text-gray-500">
                    {t('plural_label', { plural: currentCard.card.plural })}
                  </p>
                )}

                <div className="mt-4">
                  <SolutionAudioButton
                    text={displayWord}
                    audioUrl={currentCard.card.audio_url}
                    label={t('listen_word')}
                    ariaLabel={t('listen_word_aria', { word: currentCard.card.word_de })}
                    variant="secondary"
                  />
                </div>

                {/* Direkt bewerten – ohne Bestätigungsmeldung, der Wechsel erfolgt sofort. */}
                <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleAnswer(false)}
                    disabled={isExiting}
                    className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-50 py-4 text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                  >
                    <X size={30} className="mb-1" aria-hidden="true" />
                    <span className="text-xl font-bold">{t('didnt_know')}</span>
                    <span className="mt-1 text-base opacity-90">{t('didnt_know_hint')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswer(true)}
                    disabled={isExiting}
                    className="flex min-h-16 flex-1 flex-col items-center justify-center rounded-2xl border-2 border-green-300 bg-green-50 py-4 text-green-800 transition-colors hover:bg-green-100 disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                  >
                    <Check size={30} className="mb-1" aria-hidden="true" />
                    <span className="text-xl font-bold">{t('knew_it')}</span>
                    <span className="mt-1 text-base opacity-90">{t('knew_it_hint')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-white p-6 sm:p-8">
                <button
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  disabled={isExiting}
                  className="w-full rounded-2xl bg-blue-600 py-6 text-2xl font-bold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-lg disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
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
        </div>
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
