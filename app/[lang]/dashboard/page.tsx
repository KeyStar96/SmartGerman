import Link from 'next/link'
import { BookOpen, ChevronRight, Lock } from 'lucide-react'

const LEVELS = [
  { id: 'A1.1', title: 'A1.1 Anfänger', description: 'Die ersten Schritte in der deutschen Sprache. Begrüßung, Alphabet, Zahlen, erste Sätze.', color: 'from-orange-400 to-[#FF5C00]' },
  { id: 'A1.2', title: 'A1.2 Anfänger', description: 'Erweiterung des Grundwortschatzes und einfache grammatikalische Strukturen.', color: 'from-[#FF5C00] to-orange-600' },
  { id: 'A2.1', title: 'A2.1 Grundlegende Kenntnisse', description: 'Du lernst, dich in alltäglichen Situationen besser auszudrücken.', color: 'from-orange-500 to-red-500' },
  { id: 'A2.2', title: 'A2.2 Grundlegende Kenntnisse', description: 'Festigung der Grammatik und komplexere Gespräche im Alltag.', color: 'from-red-500 to-red-700' },
  { id: 'B1.1', title: 'B1.1 Fortgeschrittene', description: 'Verstehen von Texten zu vertrauten Themen, Meinungsäußerung.', color: 'from-slate-600 to-slate-800' },
  { id: 'B1.2', title: 'B1.2 Fortgeschrittene', description: 'Fließende Unterhaltungen und detailliertes Verständnis von Texten.', color: 'from-slate-800 to-slate-950' },
]

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          Wähle dein <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-[#FF5C00]">Sprachniveau</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Womit möchtest du heute starten? Wähle dein Niveau aus, um auf Lektionen, Vokabeln und Videos zuzugreifen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LEVELS.map((level) => (
          <Link
            key={level.id}
            href={`/${lang}/dashboard/level/${level.id}`}
            className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
          >
            {/* Color accent bar at the top */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${level.color}`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${level.color} text-white shadow-lg`}>
                <BookOpen size={28} />
              </div>
              <span className="text-3xl font-extrabold text-slate-200 dark:text-slate-800 group-hover:text-slate-300 dark:group-hover:text-slate-700 transition-colors">
                {level.id}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#FF5C00] transition-colors">
              {level.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 line-clamp-3">
              {level.description}
            </p>
            
            <div className="flex items-center text-sm font-bold text-[#FF5C00]">
              Starten <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
