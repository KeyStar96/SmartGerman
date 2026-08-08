import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PremiumPage({
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

  // Profil-Daten laden (Abo-Status überprüfen)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  // Premium Check
  if (profile?.subscription_status !== 'aktiv') {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 mb-6">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium-Inhalte gesperrt</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Dieser Bereich ist nur für Nutzer mit einem aktiven Abonnement zugänglich. Bitte aktualisiere deinen Plan, um fortzufahren.
        </p>
        <button className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all">
          Jetzt Premium werden
        </button>
        <div className="mt-4">
            <Link href={`/${lang}/dashboard`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Zurück zum Dashboard
            </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center gap-x-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Premium Lernbereich</h1>
        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          Aktiv
        </span>
      </div>
      
      <p className="text-gray-600 mb-8">
        Willkommen in deinen Premium-Kursen! Hier hast du Zugriff auf alle exklusiven Lernmaterialien.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Beispiel für Premium-Content-Karten */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
            <div className="aspect-[16/9] w-full rounded-lg bg-gray-100 mb-4 overflow-hidden">
                <div className="w-full h-full bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center">
                    <span className="text-blue-300 group-hover:text-blue-400 font-medium">Video Lektion {item}</span>
                </div>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              Intensivkurs Modul {item}
            </h3>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              Tiefergehende Grammatik-Erklärungen und exklusive Hörübungen für schnelleres Lernen.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
