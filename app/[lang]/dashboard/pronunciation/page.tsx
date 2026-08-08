import { getStudentSubmissions } from '@/app/actions/feedback'
import AudioRecorder from '@/components/audio/AudioRecorder'
import { Clock, CheckCircle2, MessageSquare } from 'lucide-react'

export default async function PronunciationDashboard() {
  const submissions = await getStudentSubmissions()

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Aussprache-Training</h1>
        <p className="text-xl opacity-90">
          Nimm einen kurzen Satz auf und reiche ihn ein. Unsere Lehrkräfte geben dir persönliches Feedback zu deiner Aussprache.
        </p>
      </div>

      {/* Recorder Component */}
      <AudioRecorder />

      {/* History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Deine bisherigen Einreichungen</h2>
        
        {submissions.length === 0 ? (
          <p className="text-lg text-gray-500 bg-gray-50 p-6 rounded-2xl text-center">
            Du hast noch keine Aufnahmen eingereicht.
          </p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="text-sm font-medium">
                      {new Date(sub.created_at).toLocaleDateString('de-DE', { 
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  {sub.status === 'pending' ? (
                    <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold">
                      <Clock size={18} /> In Bearbeitung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold">
                      <CheckCircle2 size={18} /> Feedback erhalten
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Deine Aufnahme</p>
                  <audio src={sub.content_url} controls className="w-full max-w-md h-12" />
                </div>

                {sub.status === 'reviewed' && sub.teacher_feedback && sub.teacher_feedback.length > 0 && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-900 font-bold mb-3">
                      <MessageSquare size={20} /> Lehrer-Feedback
                    </div>
                    <p className="text-lg text-blue-900 leading-relaxed">
                      {sub.teacher_feedback[0].feedback_text}
                    </p>
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
