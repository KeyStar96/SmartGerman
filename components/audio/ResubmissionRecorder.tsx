'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import {
  createPronunciationTranslator,
  type PronunciationTranslations,
} from '@/lib/pronunciation-i18n'

/** Zweiter Versuch nach erhaltenem Feedback – bewusst hinter einem Klick versteckt. */
export default function ResubmissionRecorder({
  parentId,
  currentAttempt = 1,
  level,
  translations,
}: {
  parentId: string
  currentAttempt?: number
  level?: string
  translations?: PronunciationTranslations
}) {
  const t = createPronunciationTranslator(translations ?? {})
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
      {!isOpen ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg text-slate-600 dark:text-slate-400">{t('resubmit_hint')}</p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-2xl bg-[#FF5C00] px-6 text-lg font-bold text-white transition-colors hover:bg-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Mic size={22} aria-hidden="true" /> {t('resubmit_button')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('attempt_label', { attempt: currentAttempt + 1 })}
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-12 rounded-xl px-4 text-lg font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {t('resubmit_cancel')}
            </button>
          </div>
          <AudioRecorder
            parentId={parentId}
            attemptNumber={currentAttempt + 1}
            level={level}
            translations={translations}
            compact
            onSubmitted={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
