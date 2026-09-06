import { createTranslator, type Translations, type Translator } from '@/lib/i18n-runtime'

export const PROFILE_FALLBACKS = {
  title: 'Mein Profil',
  personal_data: 'Persönliche Daten',
  name: 'Name',
  email: 'E-Mail-Adresse',
  native_language: 'Erstsprache',
  not_specified: 'Nicht angegeben',
  subscription: 'Abonnement',
  premium_active: 'Premium aktiv',
  free_plan: 'Kostenlos',
  premium_description: 'Du hast vollen Zugriff auf alle Premium-Inhalte, den Vokabeltrainer und die Übungen.',
  free_description:
    'Aktiviere Premium, um unbegrenzten Zugriff auf alle Video-Lektionen, den Vokabeltrainer und Grammatikübungen zu erhalten.',
  manage_subscription: 'Abonnement verwalten',
  activate_premium: 'Jetzt Premium aktivieren',
  payment_cancelled_title: 'Zahlung abgebrochen',
  payment_cancelled_text: 'Der Bezahlvorgang wurde abgebrochen. Es wurde kein Geld abgebucht.',
  lang_russian: 'Russisch',
  lang_turkish: 'Türkisch',
  lang_ukrainian: 'Ukrainisch',
  lang_english: 'Englisch',
  lang_german: 'Deutsch',
  lang_other: 'Andere',
  // Oberflächensprache (manuell änderbar)
  ui_language: 'Sprache der Oberfläche',
  ui_language_description: 'Wähle, in welcher Sprache Menüs, Buttons und Texte angezeigt werden.',
  ui_language_save: 'Sprache speichern',
  error_title: 'Das Profil konnte leider nicht geladen werden.',
  error_description: 'Das lag nicht an dir. Versuche es bitte noch einmal.',
  error_retry: 'Nochmal versuchen',
  loading: 'Das Profil wird geladen …',
} as const

export type ProfileTranslationKey = Extract<keyof typeof PROFILE_FALLBACKS, string>

export type ProfileTranslations = Translations

export type ProfileTranslator = Translator<ProfileTranslationKey>

export function createProfileTranslator(translations: ProfileTranslations): ProfileTranslator {
  return createTranslator(PROFILE_FALLBACKS, translations)
}

const NATIVE_LANGUAGE_KEYS: Record<string, ProfileTranslationKey> = {
  Russisch: 'lang_russian',
  Türkisch: 'lang_turkish',
  Ukrainisch: 'lang_ukrainian',
  Englisch: 'lang_english',
  Deutsch: 'lang_german',
  Andere: 'lang_other',
}

export function translateNativeLanguage(
  t: ProfileTranslator,
  value: string | null | undefined
): string {
  if (!value) return t('not_specified')
  const key = NATIVE_LANGUAGE_KEYS[value]
  return key ? t(key) : value
}
