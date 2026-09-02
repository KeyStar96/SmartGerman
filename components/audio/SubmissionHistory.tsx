'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, Inbox, MessageSquare, Mic, RotateCcw, Sparkles } from 'lucide-react'
import { markFeedbackSeen } from '@/app/actions/feedback'
import {
  createPronunciationTranslator,
  type PronunciationTranslations,
} from '@/lib/pronunciation-i18n'
import type { StudentSubmission } from '@/lib/types/feedback'
import ResubmissionRecorder from '@/components/audio/ResubmissionRecorder'
import WaveformPlayer from '@/components/audio/WaveformPlayer'

/**
 * Verlauf der eigenen Einreichungen.
 *
 * Client-Komponente, weil sie beim Öffnen der Seite das Feedback als gelesen
 * markiert. Die „Neu"-Markierung bleibt danach für diesen Seitenaufruf
 * sichtbar, damit der Hinweis nicht unter den Augen des Lernenden verschwindet.
 */
export default function SubmissionHistory({
  submissions,
  translations,
  lang,
  level,
}: {
  submissions: StudentSubmission[]
  translations: PronunciationTranslations
  lang: string
  level: string
}) {
  const t = createPronunciationTranslator(translations)

  const [highlightedIds] = useState<ReadonlySet<string>>(
    () => new Set(submissions.filter((entry) => entry.hasUnseenFeedback).map((entry) => entry.id))
  )
  const markedRef = useRef(false)

  useEffect(() => {
    if (markedRef.current || highlightedIds.size === 0) return
    markedRef.current = true

    void (async () => {
      for (const submissionId of highlightedIds) {
        await markFeedbackSeen(submissionId)
      }
    })()
  }, [highlightedIds])

  if (submissions.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Inbox className="h-10 w-10 text-slate-400" aria-hidden="true" />
        </div>
        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('history_empty')}</p>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">{t('history_empty_hint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const feedback = submission.teacher_feedback[0]
        const isHighlighted = highlightedIds.has(submission.id)

        return (
          <div
            key={submission.id}
            className={`rounded-3xl border bg-white p-6 shadow-sm transition-colors dark:bg-slate-900 ${
              isHighlighted
                ? 'border-[#FF5C00] ring-2 ring-[#FF5C00]/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-base font-medium text-slate-600 dark:text-slate-400">
                {submission.created_at
                  ? new Date(submission.created_at).toLocaleDateString(lang, {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {isHighlighted && (
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#FF5C00] px-4 text-base font-bold text-white">
                    <Sparkles size={18} aria-hidden="true" /> {t('new_badge')}
                  </span>
                )}
                {submission.attempt_number > 1 && (
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-100 px-4 text-base font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    <RotateCcw size={18} aria-hidden="true" />{' '}
                    {t('attempt_label', { attempt: submission.attempt_number })}
                  </span>
                )}
                {submission.status === 'reviewed' ? (
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-100 px-4 text-base font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CheckCircle2 size={18} aria-hidden="true" /> {t('status_reviewed')}
                  </span>
                ) : (
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-amber-100 px-4 text-base font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <Clock size={18} aria-hidden="true" /> {t('status_pending')}
                  </span>
                )}
              </div>
            </div>

            <WaveformPlayer src={submission.content_url} t={t} label={t('your_recording')} />

            {feedback && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                  <MessageSquare size={24} className="text-[#FF5C00]" aria-hidden="true" />
                  {t('teacher_feedback')}
                </div>

                {feedback.feedback_text && (
                  <p className="mb-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                    {feedback.feedback_text}
                  </p>
                )}

                {feedback.feedback_audio_url && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-3 flex items-center gap-2 text-base font-bold text-[#FF5C00]">
                      <Mic size={20} aria-hidden="true" /> {t('voice_message')}
                    </div>
                    <WaveformPlayer src={feedback.feedback_audio_url} t={t} />
                  </div>
                )}
              </div>
            )}

            {submission.status === 'reviewed' && !submission.hasResubmission && (
              <ResubmissionRecorder
                parentId={submission.id}
                currentAttempt={submission.attempt_number}
                level={level}
                translations={translations}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
