import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getExercises } from '@/app/actions/exercises'
import ExerciseClient from '@/components/exercises/ExerciseClient'
import { getDictionary } from '@/lib/dictionary'
import { createExerciseTranslator, type ExerciseTranslations } from '@/lib/exercise-i18n'

export default async function ExercisesPage({
  params,
}: {
  params: Promise<{ lang: string; level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const dict = await getDictionary(lang)
  const translations = (dict.exercises ?? {}) as ExerciseTranslations
  const t = createExerciseTranslator(translations)

  const exercises = await getExercises(decodedLevel)

  // Bereits gelöste Übungen werden nicht erneut abgefragt.
  const activeExercises = exercises.filter((exercise) => !exercise.completed)
  const completedCount = exercises.length - activeExercises.length

  return (
    <div className="mx-auto flex max-w-4xl flex-col lg:h-[calc(100vh-5rem)] lg:overflow-hidden">
      <div className="mb-6 flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/${lang}/dashboard/level/${encodeURIComponent(decodedLevel)}`}
            className="mb-4 inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
          >
            <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_level')}
          </Link>
          <h1 className="break-words text-3xl font-extrabold text-gray-900 sm:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-xl text-gray-600">{t('subtitle')}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-2xl font-bold text-green-600 sm:text-3xl">
            {completedCount} / {exercises.length}
          </div>
          <div className="text-sm font-medium uppercase tracking-wider text-gray-500">
            {t('completed_count')}
          </div>
        </div>
      </div>

      {/* Scrollt intern, falls Übungs-Feedback (Hinweise, Fehlermeldung) die Karte auf kleinen Bildschirmen wachsen lässt. */}
      <div className="min-h-0 flex-1 pt-2 lg:overflow-y-auto">
        <ExerciseClient
          exercises={activeExercises}
          translations={translations}
          lang={lang}
          level={decodedLevel}
        />
      </div>
    </div>
  )
}
