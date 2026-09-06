/**
 * Clientseitig gespeicherte „Lernkasten"-Auswahl: Welche Lektionen eines
 * Sprachniveaus der Lernende aktuell in seiner aktiven Lerneinheit hat.
 *
 * Persistiert je Niveau im `localStorage`, damit die Zusammenstellung einen
 * Reload und die Wiederkehr übersteht (gerätegebunden, bewusst kein
 * Server-State – die Auswahl ist eine reine UI-Vorliebe, kein Lernfortschritt).
 */

const STORAGE_PREFIX = 'sitov_lernkasten'

function storageKey(level: string): string {
  return `${STORAGE_PREFIX}:${level}`
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Lädt die gespeicherte Lektions-Auswahl eines Niveaus.
 *
 * Gibt `null` zurück, wenn noch nie etwas gespeichert wurde (Erstbesuch →
 * der Aufrufer kann dann einen sinnvollen Standard setzen), und ein (ggf.
 * leeres) Array, wenn eine Auswahl – auch bewusst geleert – vorliegt.
 * Ungültige Daten führen niemals zu einem Absturz, sondern zu `null`.
 */
export function loadLernkastenSelection(level: string): string[] | null {
  if (!isBrowser()) return null

  try {
    const raw = window.localStorage.getItem(storageKey(level))
    if (raw === null) return null

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    return parsed.filter((entry): entry is string => typeof entry === 'string')
  } catch (err) {
    console.error(`Lernkasten-Auswahl für Niveau "${level}" konnte nicht geladen werden:`, err)
    return null
  }
}

/** Speichert die Lektions-Auswahl. Fehler werden geloggt, aber nie geworfen. */
export function saveLernkastenSelection(level: string, lessons: string[]): void {
  if (!isBrowser()) return

  try {
    window.localStorage.setItem(storageKey(level), JSON.stringify(lessons))
  } catch (err) {
    console.error(`Lernkasten-Auswahl für Niveau "${level}" konnte nicht gespeichert werden:`, err)
  }
}
