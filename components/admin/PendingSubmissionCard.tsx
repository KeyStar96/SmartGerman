"use client"

import React, { useState, useRef } from 'react'
import { User, Mic, Square, Play, Trash2, Send, Loader2, RotateCcw, AlertCircle } from 'lucide-react'
import SpeedAudioPlayer from '@/components/audio/SpeedAudioPlayer'

type PendingSubmissionCardProps = {
  sub: any;
  onSubmit: (id: string, text: string, audioBlob: Blob | null) => Promise<void>;
}

export default function PendingSubmissionCard({ sub, onSubmit }: PendingSubmissionCardProps) {
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm'
        const blob = new Blob(audioChunks.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setAudioBlob(blob)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setAudioUrl(null)
    } catch (err) {
      console.error('Fehler beim Zugriff auf das Mikrofon:', err)
      setMicError('Bitte erlaube den Zugriff auf dein Mikrofon in den Browser-Einstellungen.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const deleteRecording = () => {
    setAudioUrl(null)
    setAudioBlob(null)
  }

  const handleSubmit = async () => {
    if (!feedbackText.trim() && !audioBlob) return
    setIsSubmitting(true)
    try {
      await onSubmit(sub.id, feedbackText, audioBlob)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  <span>•</span>
                  <span>{new Date(sub.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</span>
                </div>
              </div>
            </div>
            {sub.attempt_number > 1 && (
              <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                <RotateCcw size={14} /> {sub.attempt_number}. Versuch
              </span>
            )}
          </div>
          
          {sub.parent && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-75">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Vorheriger Versuch (V1)</p>
              <SpeedAudioPlayer src={sub.parent.content_url} className="w-full min-h-[48px] mb-3" />
              
              {sub.parent.teacher_feedback && sub.parent.teacher_feedback.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Dein bisheriges Feedback:</p>
                  {sub.parent.teacher_feedback[0].feedback_text && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{sub.parent.teacher_feedback[0].feedback_text}</p>
                  )}
                  {sub.parent.teacher_feedback[0].feedback_audio_url && (
                    <SpeedAudioPlayer src={sub.parent.teacher_feedback[0].feedback_audio_url} className="w-full min-h-[40px]" />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Aktuelle Aufnahme {sub.attempt_number > 1 ? `(V${sub.attempt_number})` : ''}</p>
            <SpeedAudioPlayer src={sub.content_url} className="w-full min-h-[48px]" />
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
              {isRecording && (
                <span className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded animate-pulse">
                  <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                  Aufnahme läuft...
                </span>
              )}
            </div>

            {micError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg flex items-start gap-2 border border-red-100 dark:border-red-900/30">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
            )}

            {!audioUrl && !isRecording && (
              <button
                onClick={startRecording}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-3 w-full min-h-[56px] bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] text-slate-700 dark:text-slate-200 hover:text-[#FF5C00] dark:hover:text-[#FF5C00] px-4 py-2 rounded-xl font-bold transition-all hover:shadow-sm disabled:opacity-50"
              >
                <Mic size={24} /> Sprachnachricht aufnehmen
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-3 w-full min-h-[56px] bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-md shadow-red-500/20 animate-pulse"
              >
                <Square size={20} className="fill-current" /> Aufnahme stoppen
              </button>
            )}

            {audioUrl && !isRecording && (
              <div className="flex items-center gap-3 mt-2">
                <SpeedAudioPlayer src={audioUrl} className="flex-1 min-h-[48px]" />
                <button
                  onClick={deleteRecording}
                  disabled={isSubmitting}
                  className="p-3 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-50"
                  title="Aufnahme löschen"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!feedbackText.trim() && !audioBlob) || isSubmitting}
            className="mt-auto flex items-center justify-center gap-3 w-full min-h-[56px] bg-[#FF5C00] hover:bg-[#e05200] text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" /> Feedback wird gesendet...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" /> Feedback freigeben
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
