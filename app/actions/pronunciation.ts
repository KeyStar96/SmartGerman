'use server'

import { createClient } from '@/utils/supabase/server'
import { currentUserHasLevelAccess } from '@/lib/access/server'
import {
  cefrFamilyFromLevel,
  isCefrFamily,
  type PronunciationPrompt,
} from '@/lib/pronunciation-prompts'

/**
 * Lädt die Übungssätze für das angefragte Routen-Niveau.
 *
 * Defense-in-Depth: ohne Freigabe (und ohne Admin/Teacher-Rolle) kommt
 * ein leeres Array zurück – die Route ist zusätzlich im Level-Layout gesperrt.
 * Gefiltert wird auf die CEFR-Familie (A1.1 → A1, …), damit A1.1 und A1.2
 * denselben, zum Niveau passenden Satzvorrat teilen.
 */
export async function getPronunciationPrompts(level: string): Promise<PronunciationPrompt[]> {
  try {
    const family = cefrFamilyFromLevel(level)
    if (!family) return []

    const allowed = await currentUserHasLevelAccess(level)
    if (!allowed) return []

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pronunciation_prompts')
      .select('id, cefr_level, sentence_de, focus, audio_url, sort_order')
      .eq('cefr_level', family)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Übungssätze konnten nicht geladen werden:', {
        level,
        family,
        message: error.message,
      })
      return []
    }

    const prompts: PronunciationPrompt[] = []
    for (const row of data ?? []) {
      if (!isCefrFamily(row.cefr_level) || row.sentence_de.trim().length === 0) continue
      prompts.push({
        id: row.id,
        cefrLevel: row.cefr_level,
        sentenceDe: row.sentence_de,
        focus: row.focus,
        audioUrl: row.audio_url,
        sortOrder: row.sort_order,
      })
    }
    return prompts
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Übungssätze:', {
      level,
      error: err instanceof Error ? err.message : 'unbekannt',
    })
    return []
  }
}
