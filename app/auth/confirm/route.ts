import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const lang = searchParams.get('lang') || 'de'

  // Standard-Redirect ist die Login-Seite mit einer Erfolgsmeldung
  const next = searchParams.get('next') ?? `/${lang}/login?message=Registrierung+erfolgreich.+Du+kannst+dich+nun+anmelden.`

  if (token_hash && type) {
    const supabase = await createClient()
    
    // Verifiziere das Token (aus der E-Mail)
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Wenn erfolgreich, redirecte den User zur Login-Seite
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Bei Fehler: redirecte mit einer Fehlermeldung
  return NextResponse.redirect(new URL(`/${lang}/login?message=Verifizierung+fehlgeschlagen+oder+Link+abgelaufen`, request.url))
}
