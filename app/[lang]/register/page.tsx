import { signup } from '@/app/actions/auth'
import Link from 'next/link'

export default async function RegisterPage({
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
            Konto erstellen
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bereits registriert?{' '}
            <Link
              href={`/${lang}/login`}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Hier anmelden
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" action={signup}>
          <input type="hidden" name="lang" value={lang} />
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                Vollständiger Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="Vollständiger Name"
              />
            </div>
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
              <label htmlFor="native_language" className="sr-only">
                Erstsprache
              </label>
              <select
                id="native_language"
                name="native_language"
                required
                className="relative block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all bg-white"
                defaultValue=""
              >
                <option value="" disabled>Deine Erstsprache auswählen</option>
                <option value="Russisch">Russisch</option>
                <option value="Türkisch">Türkisch</option>
                <option value="Andere">Andere</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="relative block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="Passwort (mind. 6 Zeichen)"
              />
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
              Registrieren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
