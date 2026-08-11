import Link from 'next/link'
import { BookOpen, Video, Mic, PenTool, ArrowLeft } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'videos',
    title: 'Lernvideos',
    description: 'Schau dir Erklärvideos zu Grammatik und Vokabeln an.',
    icon: Video,
    color: 'bg-blue-500',
    path: 'videos'
  },
  {
    id: 'vocabulary',
    title: 'Vokabeltrainer',
    description: 'Lerne und wiederhole wichtige Wörter für dieses Niveau.',
    icon: BookOpen,
    color: 'bg-emerald-500',
    path: 'vocabulary'
  },
  {
    id: 'exercises',
    title: 'Grammatikübungen',
    description: 'Festige dein Wissen mit Lückentexten und Multiple Choice.',
    icon: PenTool,
    color: 'bg-purple-500',
    path: 'exercises'
  },
  {
    id: 'pronunciation',
    title: 'Aussprache-Training',
    description: 'Nimm deine Stimme auf und erhalte Feedback von Lehrern.',
    icon: Mic,
    color: 'bg-[#FF5C00]',
    path: 'pronunciation'
  }
]

export default async function LevelDashboard({
  params,
}: {
  params: Promise<{ lang: string, level: string }>
}) {
  const { lang, level } = await params
  
  // URL decode just in case
  const decodedLevel = decodeURIComponent(level)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href={`/${lang}/dashboard`}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Niveau <span className="text-[#FF5C00]">{decodedLevel}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Wähle einen Lernbereich aus, um fortzufahren.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/${lang}/dashboard/level/${level}/${cat.path}`}
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${cat.color} group-hover:scale-110 transition-transform`}>
              <cat.icon size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#FF5C00] transition-colors">
                {cat.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {cat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
