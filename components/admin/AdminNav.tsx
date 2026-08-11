'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav({ lang }: { lang: string }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Übersicht', href: `/${lang}/admin`, exact: true },
    { name: 'Studenten', href: `/${lang}/admin/students` },
    { name: 'Feedback', href: `/${lang}/admin/submissions` },
    { divider: true },
    { name: 'Vokabeln', href: `/${lang}/admin/content/vocabulary` },
    { name: 'Übungen', href: `/${lang}/admin/content/exercises` },
    { name: 'Videos', href: `/${lang}/admin/content/videos` },
  ]

  return (
    <nav className="hidden lg:flex space-x-4 items-center">
      {navItems.map((item, i) => {
        if (item.divider) {
          return <div key={`div-${i}`} className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
        }
        
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href as string)

        if (isActive) {
          return (
            <Link
              key={item.href}
              href={item.href as string}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 transition-colors"
            >
              {item.name}
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href as string}
            className="inline-flex items-center px-2 pt-1 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-[#FF5C00] dark:hover:text-[#FF5C00] transition-colors"
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
