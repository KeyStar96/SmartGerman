/**
 * Kleiner Laufzeit-Helfer für Dictionary-Texte mit Platzhaltern.
 *
 * Die Texte selbst liegen in `dictionaries/*.json`. Die hier übergebenen
 * Fallbacks sind nur ein Sicherheitsnetz für fehlende Keys und stehen
 * gesammelt in `lib/*-i18n.ts` – nicht in den Komponenten.
 */

export type Translations = Readonly<Record<string, string>>

export type TranslationVariables = Readonly<Record<string, string | number>>

export type Translator<TKey extends string> = (
  key: TKey,
  variables?: TranslationVariables
) => string

export function interpolate(template: string, variables?: TranslationVariables): string {
  if (!variables) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = variables[name]
    return value === undefined ? match : String(value)
  })
}

/**
 * Baut eine Übersetzungsfunktion, die Platzhalter wie `{length}` auflöst und
 * bei fehlendem Dictionary-Eintrag auf den hinterlegten Standardtext zurückfällt.
 */
export function createTranslator<TFallbacks extends Record<string, string>>(
  fallbacks: TFallbacks,
  translations: Translations
): Translator<Extract<keyof TFallbacks, string>> {
  return (key, variables) => {
    const candidate = translations[key]
    const template =
      typeof candidate === 'string' && candidate.length > 0 ? candidate : fallbacks[key]
    return interpolate(template, variables)
  }
}
