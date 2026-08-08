import { createClient } from '@/utils/supabase/server'
import { User, Globe, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const paymentCancelled = resolvedSearchParams?.payment === 'cancelled'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.subscription_status === 'aktiv'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {paymentCancelled && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl flex gap-4 items-start shadow-sm mb-8">
          <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
          <div>
            <h4 className="text-xl font-bold text-amber-900 mb-2">Zahlung abgebrochen</h4>
            <p className="text-lg text-amber-800">
              Der Bezahlvorgang wurde abgebrochen. Es wurde kein Geld abgebucht.
            </p>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Mein Profil</h1>
      
      {/* Profil-Daten */}
      <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-gray-900/5">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Persönliche Daten</h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Name</p>
              <p className="text-xl font-bold text-gray-900">{profile?.name || 'Nicht angegeben'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">E-Mail Adresse</p>
              <p className="text-xl font-bold text-gray-900">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Muttersprache</p>
              <p className="text-xl font-bold text-gray-900">{profile?.native_language || 'Nicht angegeben'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Abonnement-Status & Stripe Checkout */}
      <div className={`rounded-3xl p-8 shadow-sm ring-1 ${isPremium ? 'bg-green-50 ring-green-900/10' : 'bg-gray-50 ring-gray-900/5'}`}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>
          {isPremium ? (
             <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-bold">
               <CheckCircle2 size={20} />
               Premium Aktiv
             </span>
          ) : (
             <span className="inline-flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-lg font-bold">
               Kostenlos
             </span>
          )}
        </div>

        {isPremium ? (
          <div>
            <p className="text-lg text-gray-700 mb-8">
              Du hast vollen Zugriff auf alle Premium-Inhalte, Vokabel-Trainer und Übungen.
            </p>
            <form action="/api/stripe/portal" method="POST">
              <button 
                type="submit"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                Abonnement verwalten / kündigen
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-700 mb-8">
              Aktiviere Premium, um unbegrenzten Zugriff auf alle Video-Lektionen, den intelligenten Vokabeltrainer und Grammatikübungen zu erhalten.
            </p>
            <form action="/api/stripe/checkout" method="POST">
              <button 
                type="submit"
                className="w-full px-8 py-5 rounded-xl font-bold text-2xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg hover:shadow-xl"
              >
                Jetzt Premium aktivieren
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
