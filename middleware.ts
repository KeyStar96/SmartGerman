import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  // 1. Supabase Session aktualisieren
  const { supabaseResponse, user } = await updateSession(request)

  // Legacy-Redirect: alte .html-Seiten → neue Pfade (permanenter 301-Redirect)
  if (pathname === '/AGB.html') {
    return NextResponse.redirect(
      new URL('/de/agb', request.url),
      { status: 301 }
    )
  }

  // Legacy-Redirect: ?lang=xx → /xx (permanenter 301-Redirect für alte URLs)
  const legacyLang = searchParams.get('lang')
  if (legacyLang) {
    const langMap: Record<string, string> = {
      en: 'en',
      ru: 'ru',
      ua: 'uk', // ua → uk (neues Kürzel)
      de: 'de',
    }
    const mappedLang = langMap[legacyLang.toLowerCase()] || 'de'
    return NextResponse.redirect(
      new URL(`/${mappedLang}`, request.url),
      { status: 301 }
    )
  }

  // Überprüfen, ob die URL bereits mit einer Sprache beginnt
  const locales = ['/de', '/en', '/uk', '/ru', '/tr']
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`${locale}/`) && pathname !== locale
  )

  // Falls die Sprache im Pfad fehlt, leiten wir auf /de weiter (301 = permanent)
  if (pathnameIsMissingLocale) {
    return NextResponse.redirect(
      new URL(`/de${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url),
      { status: 301 }
    )
  }

  // Sprache aus dem aktuellen Pfad extrahieren
  const currentLocale = locales.find(locale => pathname.startsWith(`${locale}/`) || pathname === locale) || '/de'

  // Routenschutz (Auth)
  const isProtectedPath = pathname.includes('/dashboard') || pathname.includes('/premium')
  const isAuthPath = pathname.includes('/login') || pathname.includes('/register')

  if (isProtectedPath && !user) {
    // Nicht eingeloggt auf geschützte Seite -> Login
    return NextResponse.redirect(new URL(`${currentLocale}/login`, request.url))
  }

  if (isAuthPath && user) {
    // Eingeloggt auf Login/Register Seite -> Dashboard
    return NextResponse.redirect(new URL(`${currentLocale}/dashboard`, request.url))
  }

  // Cookies und Header aus dem supabaseResponse in die aktuelle Response übernehmen, 
  // falls wir nicht redirecten (dann geben wir supabaseResponse direkt zurück).
  // Es ist einfacher, einfach supabaseResponse zurückzugeben.
  return supabaseResponse
}

export const config = {
  // Erweiteter Matcher, um alle Next-Interna und statischen Bilder sicher auszuschließen
  matcher: [
    /*
     * Matcht alle Pfade außer:
     * 1. /api (API-Routen)
     * 2. /_next (Next.js Interna wie static, image, data)
     * 3. /Bilder, /public (Deine Assets)
     * 4. favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next|Bilder|public|favicon.ico|sitemap.xml|robots.txt|google236d470275910d3c.html).*)',
  ],
}
