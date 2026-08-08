import { getLessonStats, getDueCards, initializeLesson } from '@/app/actions/vocabulary'
import Link from 'next/link'

export default async function VocabularyOverviewPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  
  // Lade Statistiken und fällige Karten
  const stats = await getLessonStats()
  const dueCards = await getDueCards()
  const dueCount = dueCards.length

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vokabel-Trainer</h1>
          <p className="text-lg text-gray-600 mt-2">
            Lerne Vokabeln mit dem bewährten Karteikasten-System (Phase-6).
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-blue-700">{dueCount}</div>
          <div className="text-lg font-medium text-blue-900 mt-1">Vokabeln fällig</div>
          
          {dueCount > 0 ? (
            <Link 
              href={`/${lang}/dashboard/vocabulary/train`}
              className="mt-4 inline-block w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-blue-500 hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Jetzt lernen
            </Link>
          ) : (
             <div className="mt-4 inline-block w-full rounded-lg bg-gray-300 px-6 py-3 text-lg font-bold text-gray-500 cursor-not-allowed">
              Alles erledigt!
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Deine Lernsets</h2>
      
      {stats.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-xl text-gray-600 mb-4">Du hast noch keine Lernsets gestartet.</p>
          <form action={async () => {
            'use server'
            await initializeLesson('Schritte plus neu A1.1 - Lektion 1')
          }}>
            <button 
              type="submit"
              className="rounded-lg bg-green-600 px-8 py-4 text-xl font-bold text-white shadow-md hover:bg-green-500 transition-all"
            >
              Lektion 1 starten
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.lesson} className="flex flex-col md:flex-row items-center justify-between p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-gray-900">{stat.lesson}</h3>
                <div className="flex gap-4 mt-2 text-base text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    {stat.active} im Training
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    {stat.learned} gelernt
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                    {stat.total} gesamt
                  </span>
                </div>
              </div>
              <div className="w-full md:w-48 bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((stat.learned / stat.total) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
