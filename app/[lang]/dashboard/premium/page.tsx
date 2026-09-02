import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDictionary } from '@/lib/dictionary'
import { createDashboardTranslator, type DashboardTranslations } from '@/lib/dashboard-i18n'

export default async function PremiumPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const supabase = await createClient()
  const dict = await getDictionary(lang)
  const t = createDashboardTranslator((dict.dashboard ?? {}) as DashboardTranslations)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_status !== 'aktiv') {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
          <svg
            className="h-8 w-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t('premium_locked_title')}</h1>
        <p className="mx-auto mb-8 max-w-md text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          {t('premium_locked_text')}
        </p>
        <Link
          href={`/${lang}/dashboard/profile`}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-lg font-bold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:w-auto"
        >
          {t('premium_cta')}
        </Link>
        <div className="mt-4">
          <Link
            href={`/${lang}/dashboard`}
            className="inline-flex min-h-12 items-center text-lg font-medium text-blue-600 hover:text-blue-500"
          >
            {t('back_to_dashboard')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('premium_area_title')}</h1>
        <span className="inline-flex self-start items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-700">
          {t('premium_area_badge')}
        </span>
      </div>

      <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">{t('premium_area_text')}</p>
    </div>
  )
}
