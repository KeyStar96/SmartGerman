import { VIDEO_FALLBACKS } from '@/lib/videos-i18n'

export default function VideosLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">{VIDEO_FALLBACKS.loading}</span>
      <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
        <div className="mb-4 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="mb-8 h-6 w-80 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map((index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="aspect-video animate-pulse bg-slate-100" />
              <div className="space-y-3 p-6">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
