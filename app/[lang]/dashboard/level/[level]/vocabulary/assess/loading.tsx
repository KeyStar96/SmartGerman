import { VOCABULARY_FALLBACKS } from '@/lib/vocabulary-i18n'

/** Skeleton in der Silhouette des Einstufungs-Durchlaufs – kein Layout-Sprung. */
export default function VocabularyAssessLoading() {
  return (
    <div
      className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{VOCABULARY_FALLBACKS.loading}</span>

      <div className="mb-6 space-y-3 border-b border-gray-200 pb-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-6 w-96 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="mx-auto h-72 max-w-2xl animate-pulse rounded-3xl bg-gray-100" />
      <div className="mx-auto mt-8 flex max-w-2xl gap-6">
        <div className="h-32 flex-1 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-32 flex-1 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </div>
  )
}
