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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-zinc-900 p-10 shadow-xl ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Konto erstellen
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bereits registriert?{' '}
            <Link
              href={`/${lang}/login`}
              className="font-medium text-primary-orange hover:text-orange-500 transition-colors"
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
                className="relative block w-full rounded-lg border-0 py-3 px-4 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-orange sm:text-sm sm:leading-6 transition-all"
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
                className="relative block w-full rounded-lg border-0 py-3 px-4 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-orange sm:text-sm sm:leading-6 transition-all"
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
                className="relative block w-full rounded-lg border-0 py-3 px-4 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-orange sm:text-sm sm:leading-6 transition-all"
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
                className="relative block w-full rounded-lg border-0 py-3 px-4 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary-orange sm:text-sm sm:leading-6 transition-all"
                placeholder="Passwort (mind. 6 Zeichen)"
              />
            </div>
          </div>

          {message && (
            <div className={`rounded-md p-4 border ${message.includes('erfolgreich') ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'}`}>
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
              className="group relative flex w-full justify-center rounded-lg bg-primary-orange py-3 px-4 text-sm font-semibold text-white hover:bg-primary-orange/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange transition-all shadow-md hover:shadow-lg"
            >
              Registrieren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
