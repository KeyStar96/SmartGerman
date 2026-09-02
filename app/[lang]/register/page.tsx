import Link from 'next/link'
import type { Metadata } from 'next'
import { signup } from '@/app/actions/auth'
import AuthForm from '@/components/auth/AuthForm'
import AuthShell from '@/components/auth/AuthShell'
import AuthStatusMessage from '@/components/auth/AuthStatusMessage'
import {
  authStatusMessage,
  authTranslations,
  createAuthTranslator,
  passwordHint,
} from '@/lib/auth-i18n'
import { getDictionary } from '@/lib/dictionary'
import { parseAuthStatus, PASSWORD_MIN_LENGTH } from '@/lib/types/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const status = parseAuthStatus(resolvedSearchParams?.status)

  const dictionary = await getDictionary(lang)
  const t = createAuthTranslator(authTranslations(dictionary))

  return (
    <AuthShell
      lang={lang}
      title={t('register_title')}
      description={
        <>
          {t('register_subtitle')}{' '}
          <Link
            href={`/${lang}/login`}
            className="font-semibold text-[#FF5C00] underline decoration-2 underline-offset-4 hover:text-[#e05200] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
          >
            {t('register_login_link')}
          </Link>
        </>
      }
    >
      {status && <AuthStatusMessage status={status} message={authStatusMessage(t, status)} />}

      <AuthForm
        action={signup}
        lang={lang}
        submitLabel={t('register_submit')}
        pendingLabel={t('register_pending')}
        fields={[
          {
            name: 'name',
            label: t('field_name'),
            type: 'text',
            placeholder: t('field_name_placeholder'),
            autoComplete: 'name',
          },
          {
            name: 'email',
            label: t('field_email'),
            type: 'email',
            placeholder: t('field_email_placeholder'),
            autoComplete: 'email',
          },
          {
            name: 'native_language',
            label: t('field_native_language'),
            type: 'select',
            placeholder: t('field_native_language_placeholder'),
            // Die Werte müssen dem CHECK-Constraint auf `profiles.native_language`
            // entsprechen, sonst scheitert der Trigger beim Anlegen des Profils.
            options: [
              { value: 'Russisch', label: t('native_language_russian') },
              { value: 'Türkisch', label: t('native_language_turkish') },
              { value: 'Andere', label: t('native_language_other') },
            ],
          },
          {
            name: 'password',
            label: t('field_password'),
            type: 'password',
            placeholder: t('field_password_placeholder'),
            autoComplete: 'new-password',
            minLength: PASSWORD_MIN_LENGTH,
            hint: passwordHint(t),
          },
        ]}
      />

      <p className="text-base text-slate-600 dark:text-slate-400">{t('spam_hint')}</p>
    </AuthShell>
  )
}
