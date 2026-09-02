import { PROFILE_FALLBACKS } from '@/lib/profile-i18n'

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">{PROFILE_FALLBACKS.loading}</span>
      <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="space-y-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
