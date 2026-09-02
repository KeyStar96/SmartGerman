/**
 * Sprach-Routing, das die Middleware und die Auth-Callback-Route teilen.
 *
 * Die Bestätigungslinks aus den E-Mails zeigen auf `/auth/confirm?lang=de&…`.
 * Würde die Middleware `?lang=` wie eine alte Marketing-URL behandeln, landete
 * der Nutzer auf `/de` – ohne Token, ohne Sitzung, ohne Konto.
 */

export const LOCALES = ['de', 'en', 'uk', 'ru', 'tr'] as const

export type UiLocale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: UiLocale = 'de'

/**
 * Alte Sprachkürzel aus den `?lang=`-URLs der Vorgänger-Website.
 * `ua` ist das alte Kürzel für Ukrainisch, heute `uk`.
 */
export const LEGACY_LANG_MAP: Readonly<Record<string, string>> = {
  de: 'de',
  en: 'en',
  ru: 'ru',
  tr: 'tr',
  uk: 'uk',
  ua: 'uk',
}

/**
 * Pfade ohne Sprachpräfix. `/auth` ist zwingend: Die Query trägt Einmal-Token.
 */
export const LOCALE_EXEMPT_PREFIXES = ['/auth', '/api'] as const

export function isLocaleExempt(pathname: string): boolean {
  return LOCALE_EXEMPT_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function localeFromPathname(pathname: string): UiLocale | null {
  const candidate = LOCALES.find(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
  return candidate ?? null
}

/**
 * Ob eine alte `?lang=`-URL auf `/{lang}` umgeleitet werden darf.
 *
 * Bewusst false für `/auth/confirm`: Dort ist `lang` ein Parameter der
 * Bestätigung, keine Legacy-Startseite.
 */
export function shouldApplyLegacyLangRedirect(
  pathname: string,
  legacyLang: string | null
): boolean {
  if (!legacyLang) return false
  if (isLocaleExempt(pathname)) return false
  if (localeFromPathname(pathname)) return false
  return true
}

export function mapLegacyLang(raw: string): UiLocale {
  const mapped = LEGACY_LANG_MAP[raw.toLowerCase()]
  return LOCALES.find(locale => locale === mapped) ?? DEFAULT_LOCALE
}

export function isProtectedPath(pathname: string): boolean {
  return (
    pathname.includes('/dashboard') ||
    pathname.includes('/premium') ||
    pathname.includes('/admin')
  )
}

export function isAuthPath(pathname: string): boolean {
  return pathname.includes('/login') || pathname.includes('/register')
}
