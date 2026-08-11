'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'

// Mapping für übersetzte Pfade
const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'Profil',
  exercises: 'Übungen',
  vocabulary: 'Vokabeln',
  videos: 'Videos',
  pronunciation: 'Aussprache',
}

export default function DashboardHeader({ lang }: { lang: string }) {
  const pathname = usePathname()
  const router = useRouter()

  // Zerteile URL und filtere leere Strings und den Sprach-Code (lang)
  const segments = pathname.split('/').filter(Boolean)
  const dashboardIndex = segments.indexOf('dashboard')
  
  if (dashboardIndex === -1) return null // Fallback, falls wir nicht im Dashboard sind

  // Relevante Segmente ab 'dashboard'
  const relevantSegments = segments.slice(dashboardIndex)
  
  // Breadcrumbs aufbauen
  const breadcrumbs: { name: string, href: string }[] = []
  let currentPath = `/${lang}`

  for (let i = 0; i < relevantSegments.length; i++) {
    const segment = relevantSegments[i]
    currentPath += `/${segment}`

    // Überspringe das Wort "level" im Breadcrumb (wir wollen nur "A1.1" sehen, nicht "Level > A1.1")
    if (segment === 'level') continue

    // Decode URL components (z.B. %20 -> space)
    const decodedSegment = decodeURIComponent(segment)
    
    // Name finden (im Dictionary oder als Raw String, wenn es ein dynamischer Wert wie A1.1 ist)
    const displayName = routeNames[segment] || decodedSegment

    breadcrumbs.push({
      name: displayName,
      href: currentPath
    })
  }

  // Zurück-Logik deterministisch
  // Wenn wir mindestens 2 Ebenen tief sind, können wir eins zurück. 
  // "level" ist ein verstecktes Verzeichnis, daher müssen wir ggf. 2 Schritte im Array zurückgehen
  const getBackHref = () => {
    if (breadcrumbs.length <= 1) return null
    return breadcrumbs[breadcrumbs.length - 2].href
  }

  const backHref = getBackHref()

  return (
    <div className="flex items-center space-x-4 ml-4 md:ml-8 flex-1">
      {/* Zurück-Button */}
      {backHref && (
        <Link 
          href={backHref}
          className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          title="Zurück"
        >
          <ArrowLeft size={20} />
        </Link>
      )}

      {/* Breadcrumbs */}
      <nav className="hidden sm:flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <li key={crumb.href} className="flex items-center">
                <Link
                  href={crumb.href}
                  className={`text-sm font-bold transition-colors ${
                    isLast 
                      ? 'text-[#FF5C00] cursor-default pointer-events-none' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {crumb.name}
                </Link>
                {!isLast && (
                  <ChevronRight size={16} className="ml-2 text-slate-400 dark:text-slate-600" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      
      {/* Mobile Title (just shows the current active page) */}
      <div className="sm:hidden text-sm font-bold text-[#FF5C00]">
        {breadcrumbs[breadcrumbs.length - 1]?.name}
      </div>
    </div>
  )
}
