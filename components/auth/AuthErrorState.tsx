'use client'

import { RotateCcw } from 'lucide-react'
import { AUTH_FALLBACKS } from '@/lib/auth-i18n'

/**
 * Fallback-Oberfläche für die `error.tsx` der Auth-Routen.
 *
 * Als Client Component ohne Zugriff auf die Dictionaries greift sie auf die
 * deutschen Standardtexte zurück. Das ist bewusst so: Ein Fehler darf keinen
 * zweiten Ladevorgang auslösen, und Deutsch ist die Standardsprache der
 * Plattform.
 */
export default function AuthErrorState({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {AUTH_FALLBACKS.error_title}
        </h1>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          {AUTH_FALLBACKS.error_description}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#FF5C00] px-6 text-xl font-bold text-white shadow-md transition-colors hover:bg-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
        >
          <RotateCcw size={24} aria-hidden="true" />
          {AUTH_FALLBACKS.error_retry}
        </button>
      </div>
    </div>
  )
}
