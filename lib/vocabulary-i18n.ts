import { createTranslator, type Translations, type Translator } from '@/lib/i18n-runtime'

/**
 * Zentrale Textbausteine des Vokabeltrainers. Die Werte sind Notfall-Fallbacks;
 * im Regelfall kommen die Texte aus `dictionaries/*.json` (Key `vocabulary`).
 */
export const VOCABULARY_FALLBACKS = {
  title: 'Vokabel-Trainer',
  subtitle: 'Lerne Vokabeln mit dem bewährten Phase-6-Karteikasten.',
  due_count: 'Vokabeln fällig',
  start_learning: 'Jetzt lernen',
  all_done: 'Alles erledigt!',
  your_sets: 'Deine Lernsets',
  no_sets: 'Für dieses Sprachniveau gibt es noch keine Lernsets.',
  no_sets_hint: 'Deine Lehrerin stellt hier bald neue Vokabeln für dich ein.',
  in_training: 'im Training',
  learned: 'gelernt',
  total: 'gesamt',
  due_now: 'jetzt fällig',
  start_set: 'Lernset starten',
  back_to_overview: 'Zurück zur Übersicht',
  back_to_level: 'Zurück zur Übersicht',
  card_progress: 'Karte {current} von {total}',
  lesson_label: 'Lektion {lesson}',
  phase_label: 'Phase {phase} von 6',
  phase_explanation: 'Je höher die Phase, desto länger die Pause bis zur Wiederholung.',
  reveal_solution: 'Lösung aufdecken',
  next_card: 'Nächste Karte',
  finish_session: 'Session beenden',
  knew_it: 'Wusste ich',
  knew_it_hint: 'Eine Phase weiter',
  didnt_know: 'Wusste ich nicht',
  didnt_know_hint: 'Eine Phase zurück',
  plural_label: 'Plural: {plural}',
  listen_word: 'Vokabel anhören',
  listen_word_aria: 'Die Vokabel „{word}" anhören',
  no_translation: 'Für diese Vokabel fehlt noch die Übersetzung.',
  moved_forward: 'Weiter in Phase {phase}. Wiederholung in {days} Tagen.',
  moved_forward_tomorrow: 'Weiter in Phase {phase}. Wiederholung schon morgen.',
  moved_back: 'Zurück in Phase {phase}. Du siehst diese Vokabel morgen wieder.',
  became_learned: 'Diese Vokabel sitzt! Sie wandert ins Archiv.',
  nothing_due_title: 'Für heute ist alles gelernt.',
  nothing_due_text: 'Komm morgen wieder – dann sind die nächsten Vokabeln fällig.',
  session_done_title: 'Fantastisch!',
  session_done_text: 'Du hast alle fälligen Vokabeln für heute gelernt.',
  save_failed: 'Der Lernstand konnte gerade nicht gespeichert werden. Das lag nicht an dir.',
  image_alt: 'Bild zur Vokabel',
  loading: 'Die Vokabeln werden geladen …',
  error_title: 'Der Vokabeltrainer konnte leider nicht geladen werden.',
  error_description: 'Das lag nicht an dir. Versuche es bitte noch einmal.',
  error_retry: 'Nochmal versuchen',
} as const

export type VocabularyTranslationKey = Extract<keyof typeof VOCABULARY_FALLBACKS, string>

export type VocabularyTranslations = Translations

export type VocabularyTranslator = Translator<VocabularyTranslationKey>

export function createVocabularyTranslator(
  translations: VocabularyTranslations
): VocabularyTranslator {
  return createTranslator(VOCABULARY_FALLBACKS, translations)
}
