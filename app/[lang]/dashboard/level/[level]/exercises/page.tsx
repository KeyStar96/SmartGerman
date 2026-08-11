import { getExercises } from '@/app/actions/exercises'
import ExerciseClient from '@/components/exercises/ExerciseClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDictionary } from '@/lib/dictionary'

export default async function ExercisesPage({
  params,
}: {
  params: Promise<{ lang: string, level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const dict = await getDictionary(lang)
  
  // Abruf aller Übungen für dieses Niveau
  const exercises = await getExercises(decodedLevel)
  
  // Filtere nach unvollständigen Übungen (für den Übungsdurchlauf)
  const activeExercises = exercises.filter(ex => !ex.completed)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <Link 
            href={`/${lang}/dashboard`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-4 text-lg transition-colors"
          >
            <ArrowLeft size={24} /> {dict.exercises?.back_to_dashboard || 'Zurück zum Dashboard'}
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900">{dict.exercises?.title || 'Interaktive Übungen'}</h1>
          <p className="text-xl text-gray-600 mt-2">{dict.exercises?.subtitle || 'Trainiere Grammatik und Wortschatz gezielt.'}</p>
        </div>
        <div className="text-right hidden sm:block">
           <div className="text-3xl font-bold text-green-600">
             {exercises.length - activeExercises.length} / {exercises.length}
           </div>
           <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{dict.exercises?.completed_count || 'Abgeschlossen'}</div>
        </div>
      </div>

      <div className="mt-8">
        <ExerciseClient exercises={activeExercises} translations={dict.exercises || {}} />
      </div>
    </div>
  )
}
