'use client'

import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Info } from 'lucide-react'
import type { ExerciseTranslator } from '@/lib/exercise-i18n'
import type { MultipleChoiceExercise as MultipleChoiceExerciseData } from '@/lib/types/exercise'
import { cn } from '@/lib/utils'

interface MultipleChoiceExerciseProps {
  exercise: MultipleChoiceExerciseData
  t: ExerciseTranslator
  onAttempt: (isCorrect: boolean, hintShown: boolean) => void
  onNext: () => void
  nextLabel: string
}

function isSameOption(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('de-DE') === right.trim().toLocaleLowerCase('de-DE')
}

/**
 * Multiple Choice im gleichen Zero-Error-Muster wie der Lückentext:
 * Eine falsche Auswahl wird ausgegraut, die Aufgabe bleibt offen.
 */
export default function MultipleChoiceExerciseCard({
  exercise,
  t,
  onAttempt,
  onNext,
  nextLabel,
}: MultipleChoiceExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [excludedOptions, setExcludedOptions] = useState<readonly string[]>([])
  const [failedAttempts, setFailedAttempts] = useState(exercise.attempts)
  const [isSolved, setIsSolved] = useState(false)
  const [showRetryNotice, setShowRetryNotice] = useState(false)

  const handleSelect = (option: string): void => {
    if (isSolved || excludedOptions.includes(option)) return
    setShowRetryNotice(false)
    setSelectedOption((current) => (current === option ? null : option))
  }

  const handleCheck = (): void => {
    if (!selectedOption || isSolved) return

    const isCorrect = isSameOption(selectedOption, exercise.content.correct_answer)
    onAttempt(isCorrect, false)

    if (isCorrect) {
      setIsSolved(true)
      setShowRetryNotice(false)
      return
    }

    setExcludedOptions((current) => [...current, selectedOption])
    setSelectedOption(null)
    setFailedAttempts((current) => current + 1)
    setShowRetryNotice(true)
  }

  return (
    <div className="p-5 sm:p-10">
      <h3 className="break-words text-xl font-bold leading-relaxed text-gray-900 dark:text-slate-100 sm:text-2xl">{exercise.content.question}</h3>

      <div className="mt-8 space-y-4">
        {exercise.content.options.map((option) => {
          const isExcluded = excludedOptions.includes(option)
          const isSelected = selectedOption === option
          const isCorrectAndSolved = isSolved && isSameOption(option, exercise.content.correct_answer)

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={isExcluded || isSolved}
              aria-pressed={isSelected}
              aria-label={isExcluded ? t('chip_wrong_aria', { word: option }) : t('choose_word_aria', { word: option })}
              className={cn(
                'flex min-h-16 w-full items-center rounded-2xl border-2 px-6 py-4 text-left text-xl font-medium transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]',
                isCorrectAndSolved && 'border-green-500 bg-green-50 font-bold text-green-800',
                !isCorrectAndSolved && isExcluded && 'cursor-not-allowed border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800/80 text-gray-400 dark:text-slate-500 line-through',
                !isCorrectAndSolved && !isExcluded && isSelected && 'border-blue-600 bg-blue-600 text-white shadow-lg',
                !isCorrectAndSolved && !isExcluded && !isSelected && 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>

      {showRetryNotice && !isSolved && (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex items-start gap-4 rounded-2xl border-2 border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-6"
        >
          <Info className="mt-1 h-8 w-8 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-500">{t('try_again')}</p>
            <p className="mt-1 text-lg text-amber-800 dark:text-amber-400/90">{t('try_again_detail')}</p>
          </div>
        </div>
      )}

      {exercise.hint && failedAttempts > 0 && !isSolved && (
        <div className="mt-6 flex items-start gap-4 rounded-r-2xl border-l-4 border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 p-6">
          <AlertCircle className="mt-1 h-8 w-8 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <h4 className="mb-1 text-xl font-bold text-amber-900 dark:text-amber-500">{t('tip_mother_tongue')}</h4>
            <p className="text-lg text-amber-800 dark:text-amber-400/90">{exercise.hint}</p>
          </div>
        </div>
      )}

      {isSolved && (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex items-center gap-4 rounded-2xl border-2 border-green-200 dark:border-green-700/50 bg-green-50 dark:bg-green-950/30 p-6"
        >
          <CheckCircle2 className="h-9 w-9 shrink-0 text-green-600 dark:text-green-500" aria-hidden="true" />
          <p className="text-2xl font-bold text-green-800 dark:text-green-500">{t('correct_well_done')}</p>
        </div>
      )}

      <div className="mt-10 flex flex-col sm:flex-row sm:justify-end">
        {isSolved ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gray-900 dark:bg-slate-700 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-gray-800 dark:hover:bg-slate-600 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:w-auto"
          >
            {nextLabel}
            <ArrowRight size={28} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCheck}
            disabled={!selectedOption}
            className="min-h-16 w-full rounded-2xl bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:w-auto"
          >
            {t('check_answer')}
          </button>
        )}
      </div>
    </div>
  )
}
