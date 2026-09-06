import { createClient } from '@/utils/supabase/server'
import { User, Globe, Mail } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/lib/dictionary'
import {
  createProfileTranslator,
  translateNativeLanguage,
  type ProfileTranslations,
} from '@/lib/profile-i18n'

export default async function ProfilePage({
  params,
}: {
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

  const dict = await getDictionary(lang)
  const t = createProfileTranslator((dict.profile ?? {}) as ProfileTranslations)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="mx-auto max-w-3xl space-y-8">
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
    </div>
  )
}
