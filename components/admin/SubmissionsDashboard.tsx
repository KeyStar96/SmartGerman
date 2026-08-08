"use client"

import React, { useState } from 'react'
import { submitTeacherFeedback } from '@/app/actions/feedback'
import { Clock, CheckCircle2, Send, Loader2, User, Mic, RotateCcw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import PendingSubmissionCard from './PendingSubmissionCard'
import SpeedAudioPlayer from '@/components/audio/SpeedAudioPlayer'

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
  const handleFeedbackSubmit = async (id: string, text: string, audioBlob: Blob | null) => {
    try {
      let audioUrl = undefined

      if (audioBlob) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not logged in')

        const fileName = `feedback/${id}_${Date.now()}.webm`
        
        const { data, error } = await supabase.storage
          .from('audio_submissions')
          .upload(fileName, audioBlob, { contentType: 'audio/webm' })

        if (error) throw error

        const { data: publicUrlData } = supabase.storage
          .from('audio_submissions')
          .getPublicUrl(fileName)
          
        audioUrl = publicUrlData.publicUrl
      }

      const res = await submitTeacherFeedback(id, text, audioUrl)
      if (!res.success) {
        alert('Fehler beim Speichern des Feedbacks: ' + res.error)
      }
    } catch (err) {
      console.error(err)
      alert('Ein unerwarteter Fehler ist aufgetreten.')
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
                      {sub.attempt_number > 1 && (
                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                          <RotateCcw size={14} /> {sub.attempt_number}. Versuch
                        </span>
                      )}
                    </div>
                    
                    {sub.parent && (
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 opacity-75">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Vorheriger Versuch (V1)</p>
                        <SpeedAudioPlayer src={sub.parent.content_url} className="w-full h-10 mb-3" />
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Aktuelle Aufnahme {sub.attempt_number > 1 ? `(V${sub.attempt_number})` : ''}</p>
                      <SpeedAudioPlayer src={sub.content_url} className="w-full h-10" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20 h-full">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-2">Dein Feedback</p>
                      {sub.teacher_feedback?.[0]?.feedback_text && (
                        <p className="text-slate-700 dark:text-slate-300 mb-4">
                          {sub.teacher_feedback[0].feedback_text}
                        </p>
                      )}
                      {sub.teacher_feedback?.[0]?.feedback_audio_url && (
                        <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                            <Mic size={16} /> Sprachnachricht
                          </div>
                          <SpeedAudioPlayer src={sub.teacher_feedback[0].feedback_audio_url} className="w-full h-8" />
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
