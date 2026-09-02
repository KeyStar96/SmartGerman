import { AUTH_FALLBACKS } from '@/lib/auth-i18n'

/**
 * Skelett für die `loading.tsx` der Auth-Routen.
 *
 * Die Platzhalter haben dieselben Maße wie die späteren Felder, damit beim
 * Erscheinen des Formulars nichts springt.
 */
export default function AuthLoadingState({ fieldCount = 2 }: { fieldCount?: number }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-8">
        <span className="sr-only" role="status">
          {AUTH_FALLBACKS.loading}
        </span>

        <div className="mx-auto h-9 w-56 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-6 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>

          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}

          <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}
