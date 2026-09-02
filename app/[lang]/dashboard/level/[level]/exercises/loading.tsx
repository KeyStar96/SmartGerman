import { EXERCISE_FALLBACKS } from '@/lib/exercise-i18n'

/** Skeleton-Loader in der Silhouette der Übungskarte – kein Layout-Sprung. */
export default function ExercisesLoading() {
  return (
    <div className="mx-auto max-w-4xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">{EXERCISE_FALLBACKS.loading}</span>

      <div className="mb-6 space-y-3">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-6 w-96 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
        <div className="h-24 animate-pulse bg-blue-600/80" />
        <div className="space-y-8 p-10">
          <div className="mx-auto h-10 w-3/4 animate-pulse rounded-lg bg-gray-200" />
          <div className="flex flex-wrap justify-center gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-16 w-32 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
          <div className="ml-auto h-16 w-48 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
