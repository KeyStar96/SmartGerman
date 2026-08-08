import { resetPassword } from '@/app/actions/auth'
import Link from 'next/link'

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams?.message as string

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            Passwort vergessen?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={resetPassword}>
          <input type="hidden" name="lang" value={lang} />
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                E-Mail Adresse
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="E-Mail Adresse"
              />
            </div>
          </div>

          {message && (
            <div className={`rounded-md p-4 ${message.includes('gesendet') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium">{message}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              Reset-Link anfordern
            </button>
          </div>
          
          <div className="text-center mt-4">
             <Link
              href={`/${lang}/login`}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors text-sm"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
