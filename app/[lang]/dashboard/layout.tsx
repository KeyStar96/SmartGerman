import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LogOut, UserRound } from 'lucide-react'
import ThemeToggle from '@/components/layout/ThemeToggle'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getDictionary } from '@/lib/dictionary'
import { createDashboardTranslator, type DashboardTranslations } from '@/lib/dashboard-i18n'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  const [{ data: profile }, dict] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getDictionary(lang),
  ])

  if (profile?.role === 'teacher' || profile?.role === 'admin') {
    redirect(`/${lang}/admin`)
  }

  const translations = (dict.dashboard ?? {}) as DashboardTranslations
  const t = createDashboardTranslator(translations)
  const displayName = profile?.name || user.email || ''
  const isPremium = profile?.subscription_status === 'aktiv'

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 transition-colors dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-1 py-2 md:flex-row md:items-center md:gap-4 md:py-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/${lang}/dashboard`}
                className="flex h-12 shrink-0 items-center rounded-xl px-1 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
              >
                <Image
                  src="/Bilder/SG_Logo_Lightmode.png"
                  alt="Sitov Language Academy"
                  width={180}
                  height={36}
                  className="h-6 w-auto object-contain dark:hidden md:h-7"
                  priority
                  sizes="180px"
                />
                <Image
                  src="/Bilder/SG_Logo_Darkmode3.png"
                  alt="Sitov Language Academy"
                  width={180}
                  height={36}
                  className="hidden h-6 w-auto object-contain dark:block md:h-7"
                  priority
                  sizes="180px"
                />
              </Link>

              <div className="hidden min-w-0 flex-1 md:block">
                <DashboardHeader lang={lang} translations={translations} />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden min-w-0 items-center text-sm font-medium text-slate-700 lg:inline-flex dark:text-slate-300">
                <span className="max-w-[12rem] truncate">{t('hello', { name: displayName })}</span>
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                    isPremium
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                      : 'bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'
                  }`}
                >
                  {isPremium ? t('premium_badge') : t('free_badge')}
                </span>
              </span>

              <Link
                href={`/${lang}/dashboard/profile`}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-label={t('open_profile_aria')}
                title={t('open_profile')}
              >
                <UserRound size={20} aria-hidden="true" />
              </Link>

              <ThemeToggle
                lightLabel={t('toggle_theme_light')}
                darkLabel={t('toggle_theme_dark')}
              />

              <form
                action={async () => {
                  'use server'
                  await logout(lang)
                }}
              >
                <button
                  type="submit"
                  className="inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  aria-label={t('logout_aria')}
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span className="hidden md:inline">{t('logout')}</span>
                </button>
              </form>
            </div>
            </div>

            <div className="min-w-0 md:hidden">
              <DashboardHeader lang={lang} translations={translations} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>
    </div>
  )
}
