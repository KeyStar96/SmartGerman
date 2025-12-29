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
  // Ignoriere System-Dateien und statische Inhalte (Bilder, Favicon etc.)
  matcher: ['/((?!api|_next/static|_next/image|Bilder|favicon.ico).*)'],
}