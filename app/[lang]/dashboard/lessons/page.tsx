import Link from 'next/link'
import { BookOpen, Video, Pencil, Mic, ChevronRight } from 'lucide-react'

const lessons = [
  { id: 1, title: 'Begrüßung & Kennenlernen' },
  { id: 2, title: 'Familie & Freunde' },
  { id: 3, title: 'Essen & Trinken' },
  { id: 4, title: 'Meine Wohnung' },
  { id: 5, title: 'Mein Tag' },
  { id: 6, title: 'Freizeit' },
  { id: 7, title: 'Lernen ein Leben lang' },
]

export default async function LessonsOverviewPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold mb-4">A1.1 Kurs-Übersicht</h1>
        <p className="text-xl opacity-90">
          Dein Einstieg in die deutsche Sprache. Wähle eine Lektion, um Vokabeln, Grammatik und Videos zu üben.
        </p>
      </div>

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Lektion {lesson.id}: {lesson.title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href={`/${lang}/dashboard/vocabulary?lesson=${lesson.id}`}
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors border border-blue-100 text-blue-900 min-h-[120px]"
              >
                <BookOpen size={36} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg text-center">Vokabeln</span>
              </Link>
              
              <Link 
                href={`/${lang}/dashboard/exercises?lesson=${lesson.id}`}
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-amber-50 hover:bg-amber-500 hover:text-white transition-colors border border-amber-100 text-amber-900 min-h-[120px]"
              >
                <Pencil size={36} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg text-center">Übungen</span>
              </Link>

              <Link 
                href={`/${lang}/dashboard/videos?lesson=${lesson.id}`}
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-purple-50 hover:bg-purple-600 hover:text-white transition-colors border border-purple-100 text-purple-900 min-h-[120px]"
              >
                <Video size={36} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg text-center">Videos</span>
              </Link>

              <Link 
                href={`/${lang}/dashboard/pronunciation?lesson=${lesson.id}`}
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-red-50 hover:bg-red-500 hover:text-white transition-colors border border-red-100 text-red-900 min-h-[120px]"
              >
                <Mic size={36} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg text-center">Aussprache</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
