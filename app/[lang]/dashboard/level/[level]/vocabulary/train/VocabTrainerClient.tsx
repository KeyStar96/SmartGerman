'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpenCheck, Check, Inbox, Layers, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import { loadLernkastenSelection, saveLernkastenSelection } from '@/lib/vocabulary-lernkasten'
import type { DueVocabularyCard, LessonStat } from '@/lib/types/vocabulary'
import { cn } from '@/lib/utils'
import VocabCardSession from './VocabCardSession'

interface VocabTrainerClientProps {
  /** Alle heute fälligen Karten des Sprachniveaus (ungefiltert). */
  initialCards: DueVocabularyCard[]
  /** Lernstand je Lektion – Grundlage für die Lektions-Übersicht im Lernkasten. */
  lessonStats: LessonStat[]
  translations?: VocabularyTranslations
  lang: string
  level: string
}

/** Drag-and-Drop-Kennung für Lektionen. */
const DND_MIME = 'application/x-sitov-lesson'

export default function VocabTrainerClient({
  initialCards,
  lessonStats,
  translations = {},
  lang,
  level,
}: VocabTrainerClientProps) {
  const t = useMemo(() => createVocabularyTranslator(translations), [translations])
  const overviewHref = `/${lang}/dashboard/level/${encodeURIComponent(level)}/vocabulary`

  /** Fällige Karten pro Lektion – bestimmt, was in die Lerneinheit fließen kann. */
  const dueByLesson = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of initialCards) {
      map.set(item.card.lesson, (map.get(item.card.lesson) ?? 0) + 1)
    }
    return map
  }, [initialCards])

  /** Alle Lektionen des Niveaus, fällige zuerst, dann alphabetisch (stabil). */
  const lessons = useMemo(() => {
    return [...lessonStats].sort((a, b) => {
      const dueA = dueByLesson.get(a.lesson) ?? 0
      const dueB = dueByLesson.get(b.lesson) ?? 0
      if (dueA > 0 !== dueB > 0) return dueA > 0 ? -1 : 1
      return a.lesson.localeCompare(b.lesson, 'de-DE')
    })
  }, [lessonStats, dueByLesson])

  /** Nur Lektionen mit fälligen Karten lassen sich sinnvoll in den Kasten legen. */
  const selectableLessons = useMemo(
    () => new Set(lessons.filter((l) => (dueByLesson.get(l.lesson) ?? 0) > 0).map((l) => l.lesson)),
    [lessons, dueByLesson]
  )

  /**
   * Standard beim Erstbesuch: alle fälligen Lektionen sind im Kasten (das alte
   * „alles lernen"-Verhalten), aber ab jetzt bearbeitbar. Deterministisch aus
   * den Props abgeleitet, damit SSR und Client identisch rendern.
   */
  const defaultSelection = useMemo(() => [...selectableLessons], [selectableLessons])

  const [selection, setSelection] = useState<string[]>(defaultSelection)
  const [hydrated, setHydrated] = useState(false)
  const [phase, setPhase] = useState<'compose' | 'train'>('compose')
  const [sessionCards, setSessionCards] = useState<DueVocabularyCard[]>([])
  const [dragOver, setDragOver] = useState(false)

  // Gespeicherte Auswahl nach dem Mount laden (localStorage ist nur im Client da).
  useEffect(() => {
    const saved = loadLernkastenSelection(level)
    if (saved !== null) {
      // Nur noch existierende, fällige Lektionen behalten.
      setSelection(saved.filter((lesson) => selectableLessons.has(lesson)))
    }
    setHydrated(true)
    // Absichtlich nur beim Mount / Level-Wechsel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  // Auswahl erst NACH dem Hydrieren persistieren (sonst überschreibt der
  // Standard die gespeicherte Auswahl).
  useEffect(() => {
    if (!hydrated) return
    saveLernkastenSelection(level, selection)
  }, [selection, hydrated, level])

  const selectionSet = useMemo(() => new Set(selection), [selection])

  const selectedDueCount = useMemo(
    () => selection.reduce((sum, lesson) => sum + (dueByLesson.get(lesson) ?? 0), 0),
    [selection, dueByLesson]
  )

  const addLesson = useCallback(
    (lesson: string) => {
      if (!selectableLessons.has(lesson)) return
      setSelection((prev) => (prev.includes(lesson) ? prev : [...prev, lesson]))
    },
    [selectableLessons]
  )

  const removeLesson = useCallback((lesson: string) => {
    setSelection((prev) => prev.filter((entry) => entry !== lesson))
  }, [])

  const toggleLesson = useCallback(
    (lesson: string) => {
      if (!selectableLessons.has(lesson)) return
      setSelection((prev) =>
        prev.includes(lesson) ? prev.filter((entry) => entry !== lesson) : [...prev, lesson]
      )
    },
    [selectableLessons]
  )

  const selectAll = useCallback(() => setSelection([...selectableLessons]), [selectableLessons])
  const clearSelection = useCallback(() => setSelection([]), [])

  const startSession = useCallback(() => {
    const chosen = initialCards.filter((item) => selectionSet.has(item.card.lesson))
    if (chosen.length === 0) return
    setSessionCards(chosen)
    setPhase('train')
  }, [initialCards, selectionSet])

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragOver(false)
      const lesson = event.dataTransfer.getData(DND_MIME) || event.dataTransfer.getData('text/plain')
      if (lesson) addLesson(lesson)
    },
    [addLesson]
  )

  // Kein fälliger Vokabelbestand im gesamten Niveau → freundlicher Leerzustand.
  if (initialCards.length === 0) {
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

  if (phase === 'train') {
    return (
      <VocabCardSession
        cards={sessionCards}
        translations={translations}
        overviewHref={overviewHref}
        onBackToLernkasten={() => setPhase('compose')}
      />
    )
  }

  const canStart = selectedDueCount > 0

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* ── Lernkasten (Selection-Box) ───────────────────────────────── */}
      <section
        aria-label={t('lernkasten_title')}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-3xl border-2 border-dashed p-6 shadow-sm transition-colors sm:p-8',
          dragOver ? 'border-[#FF5C00] bg-orange-50' : 'border-blue-300 bg-blue-50/60'
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <Inbox size={26} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-gray-900">{t('lernkasten_title')}</h2>
            <p className="mt-1 text-base leading-relaxed text-gray-600">{t('lernkasten_intro')}</p>
          </div>
        </div>

        {selection.length === 0 ? (
          <p className="mt-6 rounded-2xl border-2 border-dashed border-blue-200 bg-white/70 p-6 text-center text-lg text-gray-600">
            {t('lernkasten_empty')}
          </p>
        ) : (
          <>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-lg font-bold text-blue-900 shadow-sm ring-1 ring-blue-100">
              <Layers size={20} aria-hidden="true" />
              {t('lernkasten_summary', { lessons: selection.length, cards: selectedDueCount })}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {selection.map((lesson) => (
                <li key={lesson}>
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-blue-200 bg-white py-2 pl-4 pr-2 text-base font-semibold text-blue-900 shadow-sm">
                    {lesson}
                    <button
                      type="button"
                      onClick={() => removeLesson(lesson)}
                      aria-label={t('lernkasten_remove_aria', { lesson })}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                    >
                      <X size={20} aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={startSession}
            disabled={!canStart}
            className="inline-flex min-h-16 flex-1 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
          >
            <Sparkles size={24} aria-hidden="true" />
            {t('lernkasten_start')}
          </button>

          {selection.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 bg-white px-6 py-4 text-lg font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              <Trash2 size={20} aria-hidden="true" />
              {t('lernkasten_clear')}
            </button>
          )}
        </div>

        {!canStart && (
          <p className="mt-3 text-base font-medium text-gray-600" role="status">
            {selection.length === 0
              ? t('lernkasten_start_hint_empty')
              : t('lernkasten_start_hint_nothing_due')}
          </p>
        )}
      </section>

      {/* ── Verfügbare Lektionen ─────────────────────────────────────── */}
      <section className="mt-8" aria-label={t('lernkasten_available_title')}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900">{t('lernkasten_available_title')}</h3>
          {selectableLessons.size > 0 && (
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex min-h-12 items-center text-lg font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              {t('lernkasten_select_all')}
            </button>
          )}
        </div>

        {lessons.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <BookOpenCheck className="h-8 w-8 text-blue-600" aria-hidden="true" />
            </div>
            <p className="break-words text-lg text-gray-600">{t('lernkasten_available_empty')}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lessons.map((stat) => {
              const due = dueByLesson.get(stat.lesson) ?? 0
              const inBox = selectionSet.has(stat.lesson)
              const disabled = due === 0

              return (
                <li key={stat.lesson}>
                  <button
                    type="button"
                    draggable={!disabled}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(DND_MIME, stat.lesson)
                      event.dataTransfer.setData('text/plain', stat.lesson)
                      event.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => toggleLesson(stat.lesson)}
                    disabled={disabled}
                    aria-pressed={inBox}
                    aria-label={
                      inBox
                        ? t('lernkasten_remove_aria', { lesson: stat.lesson })
                        : t('lernkasten_add_aria', { lesson: stat.lesson })
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left shadow-sm transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]',
                      disabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-70'
                        : inBox
                          ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                          : 'cursor-grab border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        inBox ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                      )}
                      aria-hidden="true"
                    >
                      {inBox ? <Check size={22} /> : <Plus size={22} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-bold text-gray-900">{stat.lesson}</span>
                      <span className="mt-0.5 block text-base text-gray-600">
                        {disabled
                          ? t('lernkasten_no_due_badge')
                          : t('lernkasten_lesson_meta', { due, total: stat.total })}
                      </span>
                    </span>

                    {inBox && (
                      <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                        {t('lernkasten_in_box')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="mt-8 text-center">
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
