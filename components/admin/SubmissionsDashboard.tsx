"use client"

import React, { useState } from 'react'
import { submitTeacherFeedback } from '@/app/actions/feedback'
import { Clock, CheckCircle2, Mic, RotateCcw, PartyPopper, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import PendingSubmissionCard from './PendingSubmissionCard'
import SpeedAudioPlayer from '@/components/audio/SpeedAudioPlayer'

type Submission = {
  id: string;
  content_url: string;
  created_at: string;
  status: string;
  level: string;
  profiles: {
    name: string;
    email: string;
    native_language: string;
  };
  teacher_feedback?: {
    feedback_text: string;
    feedback_audio_url?: string;
    created_at: string;
  }[];
  attempt_number?: number;
  parent?: {
    id: string;
    content_url: string;
    teacher_feedback?: {
      feedback_text: string;
      feedback_audio_url?: string;
      created_at: string;
    }[];
  };
}

export default function SubmissionsDashboard({
  pendingSubmissions,
  completedSubmissions
}: {
  pendingSubmissions: Submission[];
  completedSubmissions: Submission[];
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleFeedbackSubmit = async (id: string, text: string, audioBlob: Blob | null) => {
    setErrorMessage(null)
    try {
      let audioUrl = undefined

      if (audioBlob) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Nicht eingeloggt')

        const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'
        const fileName = `feedback/${id}_${Date.now()}.${ext}`
        
        const { error } = await supabase.storage
          .from('audio_submissions')
          .upload(fileName, audioBlob, { contentType: audioBlob.type })

        if (error) throw error

        const { data: publicUrlData } = supabase.storage
          .from('audio_submissions')
          .getPublicUrl(fileName)
          
        audioUrl = publicUrlData.publicUrl
      }

      const res = await submitTeacherFeedback(id, text, audioUrl)
      if (!res.success) {
        throw new Error(res.error || 'Speichern fehlgeschlagen.')
      }

      const submission = pendingSubmissions.find(s => s.id === id)
      const studentName = submission?.profiles?.name || 'den Schüler'
      showToast(`Feedback erfolgreich an ${studentName} gesendet!`)

    } catch (err) {
      console.error(err)
      setErrorMessage('Verbindung unterbrochen. Deine Eingaben wurden nicht gelöscht. Bitte klicke erneut auf Senden.')
      throw err // Rethrow so the card stops loading
    }
  }

  return (
    <div className="space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 font-bold">
            <CheckCircle2 size={24} />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <h4 className="font-bold text-red-800 dark:text-red-400">Fehler aufgetreten</h4>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 p-1 rounded-lg transition-colors">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Audio Auswertung</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Höre dir die Aufnahmen der Schüler an und gib persönliches Feedback.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 min-h-[48px] rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'pending' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={16} /> Offene Aufgaben ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-6 min-h-[48px] rounded-lg text-sm font-bold transition-colors ${
              activeTab === 'completed' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={16} /> Bereits korrigiert ({completedSubmissions.length})
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'pending' && (
          pendingSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-full mb-6">
                <PartyPopper className="h-16 w-16 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Alles erledigt!</h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Aktuell liegen keine neuen Sprachaufnahmen zur Korrektur vor. 🎉
              </p>
            </div>
          ) : (
            pendingSubmissions.map(sub => (
              <PendingSubmissionCard 
                key={sub.id} 
                sub={sub} 
                onSubmit={handleFeedbackSubmit} 
              />
            ))
          )
        )}

        {activeTab === 'completed' && (
          completedSubmissions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center min-h-[300px] flex items-center justify-center shadow-sm">
              <p className="text-lg text-slate-500 dark:text-slate-400">Du hast noch keine Aufnahmen bewertet.</p>
            </div>
          ) : (
            completedSubmissions.map(sub => (
              <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors opacity-90 hover:opacity-100">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{sub.profiles?.name || 'Unbekannter Schüler'}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                          <span className="bg-[#FF5C00] text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">{sub.level || 'A1.1'}</span>
                          <span>•</span>
                          <span>Deutschkurs</span>
                          <span>•</span>
                          <span>{new Date(sub.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</span>
                        </div>
                      </div>
                      {sub.attempt_number && sub.attempt_number > 1 && (
                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold">
                          <RotateCcw size={14} /> {sub.attempt_number}. Versuch
                        </span>
                      )}
                    </div>
                    
                    {sub.parent && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-75">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Vorherige Aufnahme</p>
                        <SpeedAudioPlayer src={sub.parent.content_url} className="w-full h-12 mb-3" />
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Aufnahme {sub.attempt_number && sub.attempt_number > 1 ? `(V${sub.attempt_number})` : ''}</p>
                      <SpeedAudioPlayer src={sub.content_url} className="w-full min-h-[48px]" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 h-full flex flex-col">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-4">Dein Feedback</p>
                      {sub.teacher_feedback?.[0]?.feedback_text && (
                        <p className="text-slate-700 dark:text-slate-300 mb-6 text-base leading-relaxed">
                          {sub.teacher_feedback[0].feedback_text}
                        </p>
                      )}
                      {sub.teacher_feedback?.[0]?.feedback_audio_url && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 mt-auto">
                          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                            <Mic size={18} /> Gesendete Sprachnachricht
                          </div>
                          <SpeedAudioPlayer src={sub.teacher_feedback[0].feedback_audio_url} className="w-full min-h-[48px]" />
                        </div>
                      )}
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
