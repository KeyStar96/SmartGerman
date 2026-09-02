import { VOCABULARY_FALLBACKS } from '@/lib/vocabulary-i18n'

/** Skeleton in der Silhouette der Vokabel-Übersicht – kein Layout-Sprung. */
export default function VocabularyLoading() {
  return (
    <div
      className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{VOCABULARY_FALLBACKS.loading}</span>

      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-gray-200 pb-6 md:flex-row">
        <div className="space-y-3">
          <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-6 w-96 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="h-44 w-full animate-pulse rounded-2xl bg-gray-200 md:w-56" />
      </div>

      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />

      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
