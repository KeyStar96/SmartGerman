import { VOCABULARY_FALLBACKS } from '@/lib/vocabulary-i18n'

/** Skeleton in der Silhouette einer Vokabelkarte – kein Layout-Sprung. */
export default function VocabularyTrainLoading() {
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">{VOCABULARY_FALLBACKS.loading}</span>

      <div className="mb-6 space-y-3">
        <div className="h-6 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-gray-200" />
      </div>

      <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-900/5">
        <div className="mx-auto h-8 w-40 animate-pulse rounded-full bg-gray-200" />
        <div className="mx-auto mt-10 h-14 w-72 animate-pulse rounded-2xl bg-gray-200" />
        <div className="mx-auto mt-4 h-6 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-12 h-16 w-full animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  )
}
