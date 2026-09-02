/**
 * Liest die öffentlichen Supabase-Zugangsdaten aus der Umgebung.
 *
 * Im Next.js-Bundle muss der Name `NEXT_PUBLIC_*` stehen, sonst kommt der
 * Browser-Client ohne URL und Schlüssel an. Manche Dashboards (und die
 * Checkliste für den Live-Betrieb) nutzen die kürzeren Aliase `SUPABASE_URL`
 * und `SUPABASE_ANON_KEY`. Beide Varianten sind gültig; der öffentliche Name
 * hat Vorrang, damit ein falsch gesetzter Server-Alias den Client nicht
 * überschreibt.
 */

export interface SupabasePublicEnv {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_ANON_KEY?: string
}

export interface SupabasePublicConfig {
  url: string
  anonKey: string
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

export function readSupabasePublicConfig(
  env: SupabasePublicEnv = process.env as SupabasePublicEnv
): SupabasePublicConfig {
  return {
    url: firstNonEmpty(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_URL),
    anonKey: firstNonEmpty(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, env.SUPABASE_ANON_KEY),
  }
}
