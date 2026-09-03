'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Mic, Square, Trash2, TriangleAlert, UploadCloud } from 'lucide-react'
import { submitAudioUrl } from '@/app/actions/feedback'
import { uploadStudentRecording } from '@/lib/audio/upload'
import { useAudioRecorder } from '@/lib/audio/useAudioRecorder'
import {
  createPronunciationTranslator,
  type PronunciationTranslations,
} from '@/lib/pronunciation-i18n'
import LiveWaveform from '@/components/audio/LiveWaveform'
import WaveformPlayer from '@/components/audio/WaveformPlayer'

/**
 * Aufnahme-Karte für Schüler: aufnehmen, anhören, einreichen.
 *
 * Die Aufnahme-Mechanik liegt in `useAudioRecorder`, der Upload in
 * `lib/audio/upload.ts`. Diese Komponente ist reine UI und Ablaufsteuerung.
 */
export default function AudioRecorder({
  parentId,
  attemptNumber = 1,
  level,
  translations,
  onSubmitted,
  compact = false,
}: {
  parentId?: string
  attemptNumber?: number
  level?: string
  translations?: PronunciationTranslations
  onSubmitted?: () => void
  compact?: boolean
}) {
  const t = createPronunciationTranslator(translations ?? {})
  const recorder = useAudioRecorder()

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)

  const statusMessage = (() => {
    if (recorder.status === 'denied') return t('mic_denied')
    if (recorder.status === 'unsupported') return t('mic_unsupported')
    if (recorder.status === 'failed') return t('record_failed')
    if (uploadFailed) return t('upload_failed')
    return null
  })()

  const handleStart = async () => {
    setUploadFailed(false)
    setIsSubmitted(false)
    await recorder.start()
  }

  const handleSubmit = async () => {
    if (!recorder.audioBlob || isUploading) return

    setIsUploading(true)
    setUploadFailed(false)

    try {
      const upload = await uploadStudentRecording(recorder.audioBlob)
      if (upload.success === false) {
        // Details stehen bereits im Log von `uploadStudentRecording`
        // (Bucket, Pfad, MIME-Type, Fehlergrund) – hier nur der Ablaufkontext.
        console.error('Einreichung abgebrochen: Audio-Upload fehlgeschlagen.', {
          reason: upload.reason,
          parentId,
          attemptNumber,
          level,
        })
        setUploadFailed(true)
        return
      }

      const result = await submitAudioUrl({
        url: upload.publicUrl,
        parentId,
        attemptNumber,
        level,
      })

      if (!result.success) {
        console.error('Einreichung abgebrochen: Speichern in der Datenbank fehlgeschlagen.', {
          reason: result.reason,
          parentId,
          attemptNumber,
          level,
        })
        setUploadFailed(true)
        return
      }

      setIsSubmitted(true)
      onSubmitted?.()
    } catch (err) {
      // Fängt z.B. Netzwerkabbrüche beim Aufruf der Server Action ab, die
      // sonst als unbehandelte Promise-Rejection verschwinden würden.
      console.error('Unerwarteter Fehler beim Einreichen der Aufnahme:', err)
      setUploadFailed(true)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white text-center shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        compact ? 'p-5 shadow-none' : 'p-5 sm:p-8'
      }`}
    >
      {!compact && (
        <>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('record_title')}
          </h2>
          <p className="mb-8 text-lg text-slate-600 dark:text-slate-400">{t('record_hint')}</p>
        </>
      )}

      {(recorder.isRecording || recorder.hasRecording) && (
        <div className="mb-6">
          {recorder.isRecording ? (
            <LiveWaveform
              levels={recorder.levels}
              isActive
              elapsedSeconds={recorder.elapsedSeconds}
              ariaLabel={t('waveform_live_aria')}
              analyserRef={recorder.analyserRef}
            />
          ) : (
            <WaveformPlayer src={recorder.audioUrl} t={t} label={t('your_recording')} />
          )}
        </div>
      )}

      {recorder.isRecording && (
        <p
          className="mb-6 flex items-center justify-center gap-3 text-xl font-bold text-[#FF5C00]"
          aria-live="polite"
        >
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF5C00] opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-[#FF5C00]" />
          </span>
          {t('recording_running')}
        </p>
      )}

      {statusMessage && (
        <p
          className="mx-auto mb-6 flex max-w-xl items-start gap-3 rounded-2xl bg-amber-50 p-4 text-left text-lg text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          <TriangleAlert size={24} className="mt-0.5 shrink-0" aria-hidden="true" />
          {statusMessage}
        </p>
      )}

      <div className="mb-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
        {recorder.isRecording ? (
          <button
            type="button"
            onClick={recorder.stop}
            className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 text-xl font-bold text-white shadow-lg transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:w-auto dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Square size={26} aria-hidden="true" /> {t('stop_recording')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={recorder.status === 'requesting' || isUploading}
            className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#FF5C00] px-8 text-xl font-bold text-white shadow-lg transition-colors hover:bg-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {recorder.status === 'requesting' ? (
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
            ) : (
              <Mic size={26} aria-hidden="true" />
            )}
            {recorder.hasRecording ? t('record_again') : t('start_recording')}
          </button>
        )}

        {recorder.hasRecording && !isSubmitted && (
          <button
            type="button"
            onClick={recorder.reset}
            disabled={isUploading}
            aria-label={t('delete_recording_aria')}
            className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-slate-100 px-8 text-xl font-bold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] disabled:opacity-60 sm:w-auto dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Trash2 size={26} aria-hidden="true" /> {t('delete_recording')}
          </button>
        )}
      </div>

      {recorder.hasRecording && (
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
          {isSubmitted ? (
            <div className="mx-auto inline-flex max-w-xl items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-left dark:border-emerald-800 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <div>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                  {t('submitted')}
                </p>
                <p className="mt-1 text-lg text-emerald-800/80 dark:text-emerald-300/80">
                  {t('submitted_hint')}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading}
              className="mx-auto flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-10 text-xl font-bold text-white shadow-lg transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={28} aria-hidden="true" />
              ) : (
                <UploadCloud size={28} aria-hidden="true" />
              )}
              {isUploading ? t('submitting') : t('submit_for_review')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
