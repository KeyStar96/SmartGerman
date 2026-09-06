'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { uiLanguageSchema } from '@/lib/types/auth'

/**
 * Ändert die Oberflächensprache des angemeldeten Nutzers (`profiles.ui_language`)
 * und leitet auf denselben Profil-Screen in der neuen Sprache um. Dadurch wird
 * die gesamte UI (Menüs, Buttons, Texte) sofort umgestellt.
 *
 * Wie in `auth.ts` wird `redirect()` bewusst außerhalb von `try` aufgerufen:
 * Next.js signalisiert die Weiterleitung über eine Ausnahme, die ein
 * umschließendes `catch` sonst verschlucken würde.
 */
export async function updateUiLanguage(formData: FormData): Promise<void> {
  const lang = uiLanguageSchema.parse(formData.get('ui_language') ?? undefined)
  let authenticated = false

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      authenticated = true
      const { error } = await supabase
        .from('profiles')
        .update({ ui_language: lang })
        .eq('id', user.id)

      if (error) {
        console.error('[profile] Oberflächensprache konnte nicht gespeichert werden', {
          code: error.code,
          message: error.message,
        })
      }
    }
  } catch (error) {
    console.error('[profile] Oberflächensprache: unerwarteter Fehler', {
      error: error instanceof Error ? error.message : 'unbekannt',
    })
  }

  if (!authenticated) {
    redirect(`/${lang}/login`)
  }

  revalidatePath('/', 'layout')
  redirect(`/${lang}/dashboard/profile`)
}
