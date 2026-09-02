'use client'

import { useEffect } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { PRONUNCIATION_FALLBACKS } from '@/lib/pronunciation-i18n'

/** Ruhige Fallback-UI: der Endnutzer sieht nie den technischen Fehler. */
export default function PronunciationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Aussprache-Training konnte nicht gerendert werden:', error.digest ?? error.message)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-900/5 dark:bg-slate-900">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
        <TriangleAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
        {PRONUNCIATION_FALLBACKS.error_title}
      </h1>
      <p className="mt-3 text-xl text-gray-600 dark:text-slate-400">
        {PRONUNCIATION_FALLBACKS.error_description}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-16 items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-md transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
      >
        <RefreshCw size={28} aria-hidden="true" />
        {PRONUNCIATION_FALLBACKS.error_retry}
      </button>
    </div>
  )
}
