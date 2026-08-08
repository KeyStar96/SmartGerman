import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from '@/components/layout/ThemeToggle'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  // Profil-Daten laden (für Name und Abo-Status)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href={`/${lang}/dashboard`} className="flex-shrink-0 items-center block hover:opacity-80 transition-opacity">
                <Image
                  src="/Bilder/SG_Logo_Lightmode.png"
                  alt="Sitov Language Academy"
                  width={240}
                  height={48}
                  className="h-7 md:h-8 w-auto object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/Bilder/SG_Logo_Darkmode3.png"
                  alt="Sitov Language Academy"
                  width={240}
                  height={48}
                  className="h-7 md:h-8 w-auto object-contain hidden dark:block"
                  priority
                />
              </Link>
              <nav className="hidden md:flex space-x-6 items-center">
                <Link
                  href={`/${lang}/dashboard`}
                  className="inline-flex items-center px-1 pt-1 text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-[#FF5C00] dark:hover:text-[#FF5C00] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/${lang}/dashboard/lessons`}
                  className="inline-flex items-center px-1 pt-1 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Lektionen
                </Link>
                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                  <Link
                    href={`/${lang}/admin/submissions`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 transition-colors"
                  >
                    Lehrer-Bereich
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-flex items-center">
                Hallo, {profile?.name || user.email} 
                <span className={`ml-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                  profile?.subscription_status === 'aktiv' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' : 'bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
                }`}>
                  {profile?.subscription_status === 'aktiv' ? 'Premium' : 'Free'}
                </span>
              </span>
              
              <ThemeToggle />

              <form action={async () => {
                'use server'
                await logout(lang)
              }}>
                <button
                  type="submit"
                  className="rounded-xl bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Abmelden
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
