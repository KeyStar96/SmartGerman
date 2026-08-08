"use client"

import React, { useState } from 'react'
import { submitTeacherFeedback } from '@/app/actions/feedback'
import { Clock, CheckCircle2, Send, Loader2, User } from 'lucide-react'

type Submission = {
  id: string;
  content_url: string;
  created_at: string;
  status: string;
  profiles: {
    name: string;
    email: string;
    native_language: string;
  };
  teacher_feedback?: {
    feedback_text: string;
    created_at: string;
  }[];
}

export default function SubmissionsDashboard({
  pendingSubmissions,
  completedSubmissions
}: {
  pendingSubmissions: Submission[];
  completedSubmissions: Submission[];
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  const handleFeedbackChange = (id: string, text: string) => {
    setFeedbackTexts(prev => ({ ...prev, [id]: text }))
  }

  const handleSubmit = async (id: string) => {
    const text = feedbackTexts[id]
    if (!text || text.trim() === '') return

    setIsSubmitting(prev => ({ ...prev, [id]: true }))
    try {
      const res = await submitTeacherFeedback(id, text)
      if (res.success) {
        // Erfolgreich, UI aktualisiert sich über revalidatePath
        setFeedbackTexts(prev => {
          const newTexts = { ...prev }
          delete newTexts[id]
          return newTexts
        })
      } else {
        alert('Fehler beim Speichern des Feedbacks: ' + res.error)
      }
    } catch (err) {
      console.error(err)
      alert('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Audio Auswertung</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Höre dir die Aufnahmen der Schüler an und gib persönliches Feedback.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'pending' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={16} /> Offen ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'completed' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={16} /> Korrigiert ({completedSubmissions.length})
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'pending' && (
          pendingSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Alles erledigt!</h3>
              <p className="text-slate-500 dark:text-slate-400">Es gibt keine offenen Audio-Aufnahmen zum Bewerten.</p>
            </div>
          ) : (
            pendingSubmissions.map(sub => (
              <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Info & Audio */}
                  <div className="flex-1 space-y-4">
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
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Audio-Aufnahme</p>
                      <audio src={sub.content_url} controls className="w-full h-12" />
                    </div>
                  </div>

                  {/* Right: Feedback Form */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label htmlFor={`feedback-${sub.id}`} className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Dein Feedback an den Schüler
                      </label>
                      <textarea
                        id={`feedback-${sub.id}`}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#FF5C00] focus:ring-[#FF5C00] focus:ring-1 sm:text-sm"
                        placeholder="Sehr gute Aussprache! Achte beim nächsten Mal auf..."
                        value={feedbackTexts[sub.id] || ''}
                        onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(sub.id)}
                      disabled={!feedbackTexts[sub.id]?.trim() || isSubmitting[sub.id]}
                      className="flex items-center justify-center gap-2 w-full bg-[#FF5C00] hover:bg-[#e05200] text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting[sub.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      Feedback freigeben
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'completed' && (
          completedSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">Du hast noch keine Aufnahmen bewertet.</p>
            </div>
          ) : (
            completedSubmissions.map(sub => (
              <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors opacity-75 hover:opacity-100">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{sub.profiles?.name || 'Unbekannter Schüler'}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span>{new Date(sub.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <audio src={sub.content_url} controls className="w-full h-10" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20 h-full">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-2">Dein Feedback</p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {sub.teacher_feedback?.[0]?.feedback_text || 'Kein Text hinterlegt.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
