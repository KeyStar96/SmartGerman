"use client"

import React, { useState, useRef } from 'react'
import { User, Mic, Square, Play, Trash2, Send, Loader2, RotateCcw } from 'lucide-react'
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
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
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
      alert('Bitte erlaube den Zugriff auf dein Mikrofon.')
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
    await onSubmit(sub.id, feedbackText, audioBlob)
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Info & Audio */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{sub.profiles?.name || 'Unbekannter Schüler'}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{sub.profiles?.native_language || 'Keine Sprache angegeben'}</span>
                  <span>•</span>
                  <span>{new Date(sub.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            {sub.attempt_number > 1 && (
              <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                <RotateCcw size={14} /> {sub.attempt_number}. Versuch
              </span>
            )}
          </div>
          
          {sub.parent && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 opacity-75">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Vorheriger Versuch (V1)</p>
              <SpeedAudioPlayer src={sub.parent.content_url} className="w-full h-10 mb-3" />
              
              {sub.parent.teacher_feedback && sub.parent.teacher_feedback.length > 0 && (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Dein bisheriges Feedback:</p>
                  {sub.parent.teacher_feedback[0].feedback_text && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{sub.parent.teacher_feedback[0].feedback_text}</p>
                  )}
                  {sub.parent.teacher_feedback[0].feedback_audio_url && (
                    <SpeedAudioPlayer src={sub.parent.teacher_feedback[0].feedback_audio_url} className="w-full h-8" />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Aktuelle Aufnahme {sub.attempt_number > 1 ? `(V${sub.attempt_number})` : ''}</p>
            <SpeedAudioPlayer src={sub.content_url} className="w-full h-12" />
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
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#FF5C00] focus:ring-[#FF5C00] focus:ring-1 sm:text-sm"
              placeholder="Sehr gute Aussprache! Achte beim nächsten Mal auf..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>

          {/* Teacher Recorder */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sprachnachricht</span>
              {isRecording && (
                <span className="flex items-center gap-2 text-xs font-bold text-red-500">
                  <span className="animate-pulse h-2 w-2 bg-red-500 rounded-full"></span>
                  Aufnahme läuft...
                </span>
              )}
            </div>

            {!audioUrl && !isRecording && (
              <button
                onClick={startRecording}
                className="flex items-center justify-center gap-2 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-[#FF5C00] dark:hover:border-[#FF5C00] text-slate-700 dark:text-slate-200 hover:text-[#FF5C00] dark:hover:text-[#FF5C00] px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Mic size={18} /> Sprachnachricht aufnehmen
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-slate-950 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Square size={18} /> Aufnahme stoppen
              </button>
            )}

            {audioUrl && !isRecording && (
              <div className="flex items-center gap-3 mt-4">
                <SpeedAudioPlayer src={audioUrl} className="flex-1 h-10" />
                <button
                  onClick={deleteRecording}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Aufnahme löschen"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!feedbackText.trim() && !audioBlob) || isSubmitting}
            className="mt-auto flex items-center justify-center gap-2 w-full bg-[#FF5C00] hover:bg-[#e05200] text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Feedback freigeben
          </button>
        </div>
      </div>
    </div>
  )
}
