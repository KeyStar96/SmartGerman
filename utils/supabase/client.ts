import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/supabase/database.types'

/**
 * Wird geworfen, wenn `NEXT_PUBLIC_SUPABASE_URL` und/oder
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` im Browser-Bundle fehlen. Aufrufer (z.B.
 * `lib/audio/upload.ts`) können gezielt auf diesen Fehlertyp reagieren,
 * statt ihn wie einen generischen Netzwerk- oder Storage-Fehler zu behandeln.
 */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupabaseConfigError'
  }
}

/**
 * Erstellt den Supabase-Client für den Browser.
 *
 * WICHTIG – bewusst OHNE die gemeinsame Hilfsfunktion `readSupabasePublicConfig()`:
 * Next.js ersetzt `process.env.NEXT_PUBLIC_*` im Client-Bundle rein textuell
 * zur BUILD-ZEIT (Webpack/Turbopack scannen den Quellcode nach genau diesem
 * Ausdrucksmuster). Im Browser existiert zur Laufzeit gar kein echtes
 * `process.env` mehr. Läuft der Zugriff über eine Zwischenfunktion – wie es
 * zuvor hier der Fall war (`readSupabasePublicConfig()` mit
 * `env = process.env as SupabasePublicEnv` als Default-Parameter und
 * `env.NEXT_PUBLIC_SUPABASE_URL` im Funktionskörper) –, erkennt der Compiler
 * das Muster nicht und ersetzt nichts. Im Browser blieben beide Werte dann
 * `undefined`, `createBrowserClient('', '')` schlug fehl, und genau das
 * erzeugte die Meldung
 * "@supabase/ssr: Your project's URL and API key are required...".
 *
 * Diese Datei muss die beiden `process.env.NEXT_PUBLIC_*`-Ausdrücke daher
 * IMMER direkt und literal enthalten – nicht über eine Hilfsfunktion oder
 * eine dynamische Objekt-Eigenschaft lesen.
 *
 * Plattformunabhängig: Sowohl Vercel als auch Netlify (via
 * `@netlify/plugin-nextjs`) führen denselben Next.js-Build aus und
 * benötigen die beiden Variablen daher zur BUILD-ZEIT (nicht erst zur
 * Laufzeit) – z.B. als "Shared" Environment Variables in Vercel, die auch
 * für den Build-Schritt freigegeben sind. Lokal genügt `.env.local`.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error(
      'Supabase-Client kann nicht erstellt werden: NEXT_PUBLIC_SUPABASE_URL und/oder ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen im Browser-Bundle. Prüfe .env.local (lokal) ' +
        'bzw. die Environment-Variablen des Hosting-Anbieters (Vercel/Netlify) – beide ' +
        'Variablen müssen dort zur BUILD-ZEIT verfügbar sein, nicht nur zur Laufzeit.',
      { hasUrl: Boolean(url), hasAnonKey: Boolean(anonKey) }
    )
    throw new SupabaseConfigError(
      'Supabase-Konfiguration fehlt: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY sind im Browser nicht gesetzt.'
    )
  }

  return createBrowserClient<Database>(url, anonKey)
}
