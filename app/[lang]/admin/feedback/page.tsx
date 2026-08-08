import { createClient } from '@/utils/supabase/server'
import { getPendingSubmissions, submitTeacherFeedback } from '@/app/actions/feedback'
import { redirect } from 'next/navigation'
import { User, CheckCircle } from 'lucide-react'
import { revalidatePath } from 'next/cache'

export default async function FeedbackAdminDashboard({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  // Check Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    redirect(`/${lang}/dashboard`)
  }

  const submissions = await getPendingSubmissions()

  async function handleFeedbackSubmit(formData: FormData) {
    'use server'
    const submissionId = formData.get('submissionId') as string
    const feedbackText = formData.get('feedbackText') as string
    
    if (submissionId && feedbackText) {
      await submitTeacherFeedback(submissionId, feedbackText)
      revalidatePath('/[lang]/admin/feedback', 'page')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lehrer Dashboard</h1>
          <p className="text-gray-400">Feedback zu offenen Aussprache-Übungen geben.</p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-xl text-xl font-bold border border-gray-700">
          {submissions.length} offene {(submissions.length === 1 ? 'Einreichung' : 'Einreichungen')}
        </div>
      </div>

      <div className="grid gap-6">
        {submissions.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-200">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Alles erledigt!</h2>
            <p className="text-gray-500 text-lg">Es gibt derzeit keine offenen Einreichungen zur Korrektur.</p>
          </div>
        ) : (
          submissions.map((sub: any) => (
            <div key={sub.id} className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-8">
              {/* Schüler Info */}
              <div className="md:w-1/3 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4 border-b pb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{sub.profiles?.name || 'Unbekannt'}</p>
                    <p className="text-sm text-gray-500">{sub.profiles?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Muttersprache:</span>
                    <span className="font-medium text-gray-900">{sub.profiles?.native_language || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Eingereicht am:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(sub.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="font-bold text-gray-900 mb-2 text-sm uppercase">Audioaufnahme:</p>
                  <audio src={sub.content_url} controls className="w-full h-10" />
                </div>
              </div>

              {/* Feedback Formular */}
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Feedback erstellen</h3>
                <form action={handleFeedbackSubmit} className="space-y-4">
                  <input type="hidden" name="submissionId" value={sub.id} />
                  
                  <div>
                    <textarea 
                      name="feedbackText"
                      required
                      rows={5}
                      className="w-full rounded-2xl border-2 border-gray-200 p-4 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                      placeholder={`Hallo ${sub.profiles?.name?.split(' ')[0] || 'Schüler'}, deine Aussprache ist...`}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <CheckCircle size={24} /> Feedback speichern & abschließen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
