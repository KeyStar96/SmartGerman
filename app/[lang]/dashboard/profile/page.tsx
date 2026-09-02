import { createClient } from '@/utils/supabase/server'
import { User, Globe, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/dictionary'
import {
  createProfileTranslator,
  translateNativeLanguage,
  type ProfileTranslations,
} from '@/lib/profile-i18n'

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const paymentCancelled = resolvedSearchParams?.payment === 'cancelled'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${lang}/login`)
  }

  const dict = await getDictionary(lang)
  const t = createProfileTranslator((dict.profile ?? {}) as ProfileTranslations)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isPremium = profile?.subscription_status === 'aktiv'

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {paymentCancelled ? (
        <div className="mb-8 flex items-start gap-4 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5 shadow-sm sm:p-6 dark:border-amber-400 dark:bg-amber-950/30">
          <AlertCircle className="mt-1 h-8 w-8 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="mb-2 text-xl font-bold text-amber-900 dark:text-amber-200">
              {t('payment_cancelled_title')}
            </h2>
            <p className="text-lg leading-relaxed text-amber-800 dark:text-amber-200/80">
              {t('payment_cancelled_text')}
            </p>
          </div>
        </div>
      ) : null}

      <h1 className="break-words text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
        {t('title')}
      </h1>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
        <h2 className="mb-6 border-b border-slate-200 pb-4 text-xl font-bold text-slate-900 sm:text-2xl dark:border-slate-700 dark:text-white">
          {t('personal_data')}
        </h2>

        <div className="space-y-6">
          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <User size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium tracking-wider text-slate-500 uppercase">{t('name')}</p>
              <p className="break-words text-xl font-bold text-slate-900 dark:text-white">
                {profile?.name || t('not_specified')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Mail size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium tracking-wider text-slate-500 uppercase">{t('email')}</p>
              <p className="break-all text-xl font-bold text-slate-900 dark:text-white">
                {profile?.email || t('not_specified')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Globe size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium tracking-wider text-slate-500 uppercase">{t('native_language')}</p>
              <p className="break-words text-xl font-bold text-slate-900 dark:text-white">
                {translateNativeLanguage(t, profile?.native_language)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-3xl p-5 shadow-sm ring-1 sm:p-8 ${
          isPremium
            ? 'bg-green-50 ring-green-900/10 dark:bg-emerald-950/30 dark:ring-emerald-800'
            : 'bg-slate-50 ring-gray-900/5 dark:bg-slate-900 dark:ring-slate-800'
        }`}
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">{t('subscription')}</h2>
          {isPremium ? (
            <span className="inline-flex min-h-12 items-center gap-2 self-start rounded-full bg-green-100 px-4 py-2 text-lg font-bold text-green-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              <CheckCircle2 size={20} aria-hidden="true" />
              {t('premium_active')}
            </span>
          ) : (
            <span className="inline-flex min-h-12 items-center self-start rounded-full bg-slate-200 px-4 py-2 text-lg font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {t('free_plan')}
            </span>
          )}
        </div>

        {isPremium ? (
          <div>
            <p className="mb-8 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
              {t('premium_description')}
            </p>
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="min-h-14 w-full rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-900 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                {t('manage_subscription')}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="mb-8 text-lg leading-relaxed text-slate-700 dark:text-slate-300">{t('free_description')}</p>
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="min-h-16 w-full rounded-2xl bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:text-2xl"
              >
                {t('activate_premium')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
