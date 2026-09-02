import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Gemeinsamer Rahmen der Auth-Seiten: Logo, Überschrift, Karte.
 *
 * Die Überschrift ist 24px groß (Geragogik-Vorgabe für Fragen und
 * Seitentitel), der Fließtext 18px. Das Logo verlinkt auf die Startseite,
 * damit ein versehentlicher Aufruf nicht in einer Sackgasse endet.
 */
export default function AuthShell({
  lang,
  title,
  description,
  children,
}: {
  lang: string
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center">
          <Link
            href={`/${lang}`}
            className="inline-flex min-h-14 items-center rounded-2xl px-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
          >
            <Image
              src="/Bilder/SG_Logo_Lightmode.png"
              alt="Sitov Language Academy"
              width={220}
              height={44}
              className="h-9 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/Bilder/SG_Logo_Darkmode3.png"
              alt="Sitov Language Academy"
              width={220}
              height={44}
              className="hidden h-9 w-auto object-contain dark:block"
              priority
            />
          </Link>
        </div>

        <div className="space-y-6 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
            {description && (
              <div className="text-lg text-slate-700 dark:text-slate-300">{description}</div>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
