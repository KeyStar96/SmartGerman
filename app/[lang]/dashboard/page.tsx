import Link from 'next/link'
import { BookOpen, ChevronRight, Trophy } from 'lucide-react'
import { getAllLevelsProgress } from '@/app/actions/progress'
import { getDictionary } from '@/lib/dictionary'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const progressMap = await getAllLevelsProgress()
  const dict = await getDictionary(lang)

  const LEVELS = [
    { id: 'A1.1', title: dict.dashboard?.level_a11_title || 'A1.1 Anfänger', description: dict.dashboard?.level_a11_desc || 'Die ersten Schritte in der deutschen Sprache.', color: 'from-orange-400 to-[#FF5C00]' },
    { id: 'A1.2', title: dict.dashboard?.level_a12_title || 'A1.2 Anfänger', description: dict.dashboard?.level_a12_desc || 'Erweiterung des Grundwortschatzes.', color: 'from-[#FF5C00] to-orange-600' },
    { id: 'A2.1', title: dict.dashboard?.level_a21_title || 'A2.1 Grundlegende Kenntnisse', description: dict.dashboard?.level_a21_desc || 'Besserer Ausdruck in Alltagssituationen.', color: 'from-orange-500 to-[#E65000]' },
    { id: 'A2.2', title: dict.dashboard?.level_a22_title || 'A2.2 Grundlegende Kenntnisse', description: dict.dashboard?.level_a22_desc || 'Festigung der Grammatik.', color: 'from-[#E65000] to-[#CC4700]' },
    { id: 'B1.1', title: dict.dashboard?.level_b11_title || 'B1.1 Fortgeschrittene', description: dict.dashboard?.level_b11_desc || 'Verstehen von Texten zu vertrauten Themen.', color: 'from-[#CC4700] to-[#B33E00]' },
    { id: 'B1.2', title: dict.dashboard?.level_b12_title || 'B1.2 Fortgeschrittene', description: dict.dashboard?.level_b12_desc || 'Fließende Unterhaltungen.', color: 'from-[#B33E00] to-[#993500]' },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 
          className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight"
          dangerouslySetInnerHTML={{ __html: dict.dashboard?.title_html || 'Wähle dein Sprachniveau' }}
        />
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {dict.dashboard?.subtitle || 'Womit möchtest du heute starten?'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LEVELS.map((level) => {
          const progress = progressMap[level.id] || 0
          const isStarted = progress > 0
          const isCompleted = progress === 100
          
          return (
            <Link
              key={level.id}
              href={`/${lang}/dashboard/level/${level.id}`}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-[#FF5C00]/10 hover:-translate-y-1 active:scale-[0.98]"
            >
              {/* Card Header Background Gradient */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-slate-50 dark:bg-slate-800/50 transition-colors group-hover:bg-[#FF5C00]/5 z-0" />
              
              <div className="p-8 pb-6 flex-1 relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  
                  {/* Icon Container with Brand Orange */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${level.color} shadow-lg shadow-orange-500/20 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    {isCompleted ? <Trophy size={28} /> : <BookOpen size={28} />}
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <span className="text-4xl font-extrabold text-slate-200 dark:text-slate-800 group-hover:text-[#FF5C00]/20 transition-colors">
                      {level.id}
                    </span>
                  </div>
                  
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#FF5C00] transition-colors">
                  {level.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 line-clamp-3 flex-1">
                  {level.description}
                </p>
                
                <div className="flex items-center justify-between text-sm font-bold mt-auto">
                  <span className={`flex items-center ${isStarted ? 'text-[#FF5C00]' : 'text-slate-500 dark:text-slate-400 group-hover:text-[#FF5C00]'}`}>
                    {isStarted ? dict.dashboard?.continue_learning : dict.dashboard?.start} 
                    <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                  
                  {isStarted && (
                    <span className="text-[#FF5C00] tabular-nums">
                      {progress}%
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Gamification Progress Bar */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 relative z-10 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${level.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
