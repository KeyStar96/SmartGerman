import { login } from '@/app/actions/auth'
import Link from 'next/link'

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await the params and searchParams objects
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams?.message as string

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
            Willkommen zurück
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Oder{' '}
            <Link
              href={`/${lang}/register`}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              erstelle ein neues Konto
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" action={login}>
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
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="Passwort"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Angemeldet bleiben
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Passwort vergessen?
              </a>
            </div>
          </div>

          {message && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{message}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              Anmelden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
