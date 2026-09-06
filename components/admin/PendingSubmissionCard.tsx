"use client"

import { useState } from 'react'
import { AlertCircle, Loader2, Mic, RotateCcw, Send, Square, Trash2, User } from 'lucide-react'
import LiveWaveform from '@/components/audio/LiveWaveform'
import WaveformPlayer from '@/components/audio/WaveformPlayer'
import { useAudioRecorder } from '@/lib/audio/useAudioRecorder'
import type { TeacherSubmission } from '@/lib/types/feedback'

type PendingSubmissionCardProps = {
  sub: TeacherSubmission;
  onSubmit: (id: string, text: string, audioBlob: Blob | null) => Promise<void>;
}

export default function PendingSubmissionCard({ sub, onSubmit }: PendingSubmissionCardProps) {
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const recorder = useAudioRecorder()

  const micError = (() => {
    if (recorder.status === 'denied') return 'Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.'
    if (recorder.status === 'unsupported') return 'Dieser Browser kann keine Aufnahmen machen. Bitte nutze Chrome, Safari oder Firefox.'
    if (recorder.status === 'failed') return 'Die Aufnahme hat nicht funktioniert. Bitte versuche es noch einmal.'
    return null
  })()

  const handleSubmit = async () => {
    if (!feedbackText.trim() && !recorder.audioBlob) return
    setIsSubmitting(true)
    try {
      await onSubmit(sub.id, feedbackText, recorder.audioBlob)
    } finally {
      setIsSubmitting(false)
    }
  }

  const attemptNumber = sub.attempt_number ?? 1

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Info & Audio */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{sub.profiles?.name || 'Unbekannter Schüler'}</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <span className="bg-[#FF5C00] text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">{sub.level || 'A1.1'}</span>
                  <span>•</span>
                  <span>{sub.profiles?.native_language || 'Deutschkurs'}</span>
                  {sub.created_at && (
                    <>
                      <span>•</span>
                      <span>{new Date(sub.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {attemptNumber > 1 && (
              <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                <RotateCcw size={14} /> {attemptNumber}. Versuch
              </span>
            )}
          </div>

          {sub.parent && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-75">
              <WaveformPlayer src={sub.parent.content_url} label="Vorheriger Versuch (V1)" compact />

              {sub.parent.teacher_feedback && sub.parent.teacher_feedback.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Dein bisheriges Feedback:</p>
                  {sub.parent.teacher_feedback[0].feedback_text && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{sub.parent.teacher_feedback[0].feedback_text}</p>
                  )}
                  {sub.parent.teacher_feedback[0].feedback_audio_url && (
                    <WaveformPlayer src={sub.parent.teacher_feedback[0].feedback_audio_url} compact />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <WaveformPlayer
              src={sub.content_url}
              label={`Aktuelle Aufnahme ${attemptNumber > 1 ? `(V${attemptNumber})` : ''}`}
            />
          </div>
        </div>

        {/* Right: Feedback Form & Recorder */}
        <div className="flex-1 space-y-4 flex flex-col">
          <div>
            <label htmlFor={`feedback-${sub.id}`} className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Dein Feedback an den Schüler
            </label>
            <textarea
              id={`feedback-${sub.id}`}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#FF5C00] focus:ring-[#FF5C00] focus:ring-1 sm:text-base leading-relaxed"
              placeholder="Sehr gute Aussprache! Achte beim nächsten Mal auf..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Teacher Recorder */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sprachnachricht aufnehmen</span>
              {recorder.isRecording && (
                <span className="flex items-center gap-2 text-xs font-bold text-[#FF5C00] bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                  <span className="h-2 w-2 bg-[#FF5C00] rounded-full animate-pulse"></span>
                  Aufnahme läuft
                </span>
              )}
            </div>

            {micError && (
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm font-medium rounded-lg flex items-start gap-2 border border-amber-100 dark:border-amber-900/30">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
            )}

            {recorder.isRecording && (
              <div className="mb-3">
                <LiveWaveform
                  levels={recorder.levels}
                  isActive
                  elapsedSeconds={recorder.elapsedSeconds}
                  ariaLabel="Tonspur der laufenden Aufnahme"
                  analyserRef={recorder.analyserRef}
                />
              </div>
            )}

            {!recorder.hasRecording && !recorder.isRecording && (
              <button
                type="button"
                onClick={() => void recorder.start()}
                disabled={isSubmitting || recorder.status === 'requesting'}
                className="flex items-center justify-center gap-3 w-full min-h-[56px] bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] text-slate-700 dark:text-slate-200 hover:text-[#FF5C00] dark:hover:text-[#FF5C00] px-4 py-2 rounded-xl font-bold transition-all hover:shadow-sm disabled:opacity-50"
              >
                {recorder.status === 'requesting' ? <Loader2 size={24} className="animate-spin" /> : <Mic size={24} />}
                Sprachnachricht aufnehmen
              </button>
            )}

            {recorder.isRecording && (
              <button
                type="button"
                onClick={recorder.stop}
                className="flex items-center justify-center gap-3 w-full min-h-[56px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-md"
              >
                <Square size={20} className="fill-current" /> Aufnahme stoppen
              </button>
            )}

            {recorder.hasRecording && !recorder.isRecording && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <WaveformPlayer src={recorder.audioUrl} blob={recorder.audioBlob} compact />
                </div>
                <button
                  type="button"
                  onClick={recorder.reset}
                  disabled={isSubmitting}
                  aria-label="Aufnahme verwerfen"
                  className="p-3 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-50"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!feedbackText.trim() && !recorder.audioBlob) || isSubmitting}
            className="mt-auto flex items-center justify-center gap-3 w-full min-h-[56px] bg-[#FF5C00] hover:bg-[#e05200] text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20"
          >
            <span className={isSubmitting ? 'flex items-center gap-3' : 'hidden'}>
              <Loader2 className="h-6 w-6 animate-spin" /> Feedback wird gesendet...
            </span>
            <span className={!isSubmitting ? 'flex items-center gap-3' : 'hidden'}>
              <Send className="h-5 w-5" /> Feedback freigeben
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
