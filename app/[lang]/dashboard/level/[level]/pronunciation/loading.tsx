import { PRONUNCIATION_FALLBACKS } from '@/lib/pronunciation-i18n'

/** Skeleton in der Silhouette der Aussprache-Seite – kein Layout-Sprung. */
export default function PronunciationLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">{PRONUNCIATION_FALLBACKS.loading}</span>

      <div className="h-40 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />

      <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mx-auto mt-4 h-6 w-96 max-w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mx-auto mt-8 h-16 w-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="space-y-4">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/60"
          />
        ))}
      </div>
    </div>
  )
}
