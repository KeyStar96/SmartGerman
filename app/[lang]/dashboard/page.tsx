import { CheckCircle2, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const paymentSuccess = resolvedSearchParams?.payment === 'success'

  return (
    <div className="space-y-8">
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex gap-4 items-center shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-green-600 shrink-0" />
          <div>
             <h4 className="text-2xl font-bold text-green-900 mb-2">Zahlung erfolgreich!</h4>
             <p className="text-lg text-green-800">
               Dein Premium-Abonnement ist nun aktiv. Viel Spaß mit den neuen Funktionen!
             </p>
          </div>
        </div>
      )}

      <div className="rounded-3xl bg-white p-8 md:p-12 shadow-sm ring-1 ring-gray-900/5 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Willkommen im Lern-Dashboard</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Dies ist dein persönlicher Lernbereich für den Deutschkurs A1.1. Starte direkt mit der ersten Lektion!
        </p>
        
        <Link 
          href={`/${lang}/dashboard/lessons`}
          className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-2xl shadow-xl hover:shadow-2xl transition-all"
        >
          <BookOpen size={32} />
          Zu den Lektionen
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Lernfortschritt</h3>
          <p className="text-lg text-gray-700">Du stehst noch ganz am Anfang. Klicke oben auf "Zu den Lektionen", um zu starten.</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Dein Abo</h3>
          <p className="text-lg text-gray-700">Den aktuellen Status deines Abonnements kannst du jederzeit in deinem Profil einsehen.</p>
          <div className="mt-6">
            <Link 
              href={`/${lang}/dashboard/profile`}
              className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-xl font-bold text-lg transition-colors"
            >
              Zum Profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

