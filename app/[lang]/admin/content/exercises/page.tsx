import { getExercises } from '@/app/actions/cms'
import ExerciseCMS from '@/components/admin/ExerciseCMS'

export default async function AdminExercisesPage() {
  const items = await getExercises()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Übungen verwalten</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Lege hier neue interaktive Grammatik- und Lückentexte an.
        </p>
      </div>

      <ExerciseCMS initialData={items} />
    </div>
  )
}
