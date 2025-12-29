import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Überprüfen, ob die URL bereits mit einer Sprache beginnt
  const pathnameIsMissingLocale = ['/de', '/en'].every(
    (locale) => !pathname.startsWith(`${locale}/`) && pathname !== locale
  )

  // Falls die Sprache im Pfad fehlt, leiten wir auf /de weiter
  if (pathnameIsMissingLocale) {
    return NextResponse.redirect(
      new URL(`/de${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
    )
  }
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
    '/((?!api|_next|Bilder|public|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}