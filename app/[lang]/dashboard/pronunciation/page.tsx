import { getStudentSubmissions } from '@/app/actions/feedback'
import AudioRecorder from '@/components/audio/AudioRecorder'
import { Clock, CheckCircle2, MessageSquare, Mic } from 'lucide-react'
import SpeedAudioPlayer from '@/components/audio/SpeedAudioPlayer'

export default async function PronunciationDashboard() {
  const submissions = await getStudentSubmissions()

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C00] rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <h1 className="text-3xl font-bold mb-4 relative z-10">Aussprache-Training</h1>
        <p className="text-xl opacity-90 relative z-10">
          Nimm einen kurzen Satz auf und reiche ihn ein. Unsere Lehrkräfte geben dir persönliches Feedback zu deiner Aussprache.
        </p>
      </div>

      {/* Recorder Component */}
      <AudioRecorder />

      {/* History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Deine bisherigen Einreichungen</h2>
        
        {submissions.length === 0 ? (
          <p className="text-lg text-slate-500 bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl text-center">
            Du hast noch keine Aufnahmen eingereicht.
          </p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <span className="text-sm font-medium">
                      {new Date(sub.created_at).toLocaleDateString('de-DE', { 
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  {sub.status === 'pending' ? (
                    <span className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-4 py-2 rounded-full font-bold">
                      <Clock size={18} /> In Bearbeitung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-4 py-2 rounded-full font-bold">
                      <CheckCircle2 size={18} /> Feedback erhalten
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Deine Aufnahme</p>
                  <SpeedAudioPlayer src={sub.content_url} className="w-full max-w-md h-12" />
                </div>

                {sub.status === 'reviewed' && sub.teacher_feedback && sub.teacher_feedback.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold mb-3">
                      <MessageSquare size={20} className="text-[#FF5C00]" /> Lehrer-Feedback
                    </div>
                    {sub.teacher_feedback[0].feedback_text && (
                      <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                        {sub.teacher_feedback[0].feedback_text}
                      </p>
                    )}
                    {sub.teacher_feedback[0].feedback_audio_url && (
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#FF5C00] mb-2">
                          <Mic size={18} /> Sprachnachricht
                        </div>
                        <SpeedAudioPlayer src={sub.teacher_feedback[0].feedback_audio_url} className="w-full max-w-md h-10" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
