'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const lang = formData.get('lang') as string || 'de'

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Falls Fehler, leiten wir zurück zum Login mit Error-Parameter
    redirect(`/${lang}/login?message=Konnte+nicht+eingeloggt+werden`)
  }

  revalidatePath('/', 'layout')
  redirect(`/${lang}/dashboard`)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const native_language = formData.get('native_language') as string
  const lang = formData.get('lang') as string || 'de'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        native_language, // wird für public.profiles Trigger verwendet
      }
    }
  })

  if (error) {
    redirect(`/${lang}/register?message=Fehler+bei+der+Registrierung`)
  }

  // Weiterleitung zur Bestätigungsseite oder Login
  redirect(`/${lang}/login?message=Registrierung+erfolgreich.+Bitte+E-Mail+bestätigen.`)
}

export async function logout(lang: string = 'de') {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect(`/${lang}/login`)
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const lang = formData.get('lang') as string || 'de'

  // TODO: Hier die richtige URL deiner App für das Passwort-Reset eintragen
  const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/reset-password`
    : `http://localhost:3000/${lang}/reset-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) {
    redirect(`/${lang}/login?message=Fehler+beim+Passwort+zurücksetzen`)
  }

  redirect(`/${lang}/login?message=E-Mail+zum+Zurücksetzen+gesendet`)
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const newPassword = formData.get('password') as string
  const lang = formData.get('lang') as string || 'de'

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    redirect(`/${lang}/reset-password?message=Passwort+konnte+nicht+aktualisiert+werden`)
  }

  redirect(`/${lang}/login?message=Passwort+erfolgreich+geändert`)
}
