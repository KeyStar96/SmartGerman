'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDueCards(level?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Hole das Profil für die Erstsprache
  const { data: profile } = await supabase
    .from('profiles')
    .select('native_language')
    .eq('id', user.id)
    .single()

  // Hole fällige Karten aus dem Lernfortschritt inkl. Vokabeldetails
  const now = new Date().toISOString()
  
  let query = supabase
    .from('user_vocabulary_progress')
    .select(`
      id,
      box_number,
      vocabulary_cards!inner (
        id,
        level,
        lesson,
        word_de,
        article,
        plural,
        translation_ru,
        translation_tr,
        translation_en,
        image_url,
        audio_url,
        is_hard_for_ru,
        is_hard_for_tr
      )
    `)
    .eq('user_id', user.id)
    .lte('next_review_date', now)
    .lt('box_number', 7) // 7 = fertig gelernt
    
  if (level) {
    query = query.eq('vocabulary_cards.level', level)
  }

  const { data: dueCards, error } = await query.order('next_review_date', { ascending: true })

  if (error) {
    console.error('Fehler beim Abrufen fälliger Karten:', error)
    return []
  }

  // Fürs Frontend anpassen (native_language mitgeben für korrekte Übersetzung)
  return dueCards.map((p: any) => ({
    progressId: p.id,
    boxNumber: p.box_number,
    card: p.vocabulary_cards,
    nativeLanguage: profile?.native_language
  }))
}

export async function initializeLesson(lessonName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Nicht angemeldet' }

  // Alle Karten dieser Lektion abrufen
  const { data: cards } = await supabase
    .from('vocabulary_cards')
    .select('id')
    .eq('lesson', lessonName)

  if (!cards || cards.length === 0) return { success: false, message: 'Keine Karten gefunden' }

  // Vorhandenen Fortschritt abrufen
  const { data: existingProgress } = await supabase
    .from('user_vocabulary_progress')
    .select('card_id')
    .eq('user_id', user.id)

  const existingCardIds = new Set(existingProgress?.map(p => p.card_id))

  // Nur neue Karten einfügen
  const newProgress = cards
    .filter(c => !existingCardIds.has(c.id))
    .map(c => ({
      user_id: user.id,
      card_id: c.id,
      box_number: 1,
      next_review_date: new Date().toISOString(),
    }))

  if (newProgress.length > 0) {
    await supabase.from('user_vocabulary_progress').insert(newProgress)
  }

  revalidatePath('/[lang]/dashboard/vocabulary', 'page')
  return { success: true, added: newProgress.length }
}

export async function submitAnswer(progressId: string, isCorrect: boolean, nativeLanguage: string, isHardForRu: boolean, isHardForTr: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  // Aktuellen Stand abrufen
  const { data: progress } = await supabase
    .from('user_vocabulary_progress')
    .select('box_number')
    .eq('id', progressId)
    .eq('user_id', user.id)
    .single()

  if (!progress) return { success: false }

  let newBox = progress.box_number
  let nextReview = new Date()

  if (isCorrect) {
    newBox = Math.min(newBox + 1, 7)
    
    // Basis-Intervalle in Tagen (Phase-6 Logik)
    const baseIntervals = [0, 1, 2, 4, 10, 30, 90, 365] // Index ist Box-Nummer
    let daysToAdd = baseIntervals[newBox]

    // Kontrastive Logik: Kürzere Intervalle, wenn es für die Muttersprache schwer ist
    const isHard = (nativeLanguage === 'Russisch' && isHardForRu) || 
                   (nativeLanguage === 'Türkisch' && isHardForTr)
    
    if (isHard) {
      daysToAdd = Math.max(1, Math.floor(daysToAdd / 2))
    }

    nextReview.setDate(nextReview.getDate() + daysToAdd)
  } else {
    // Bei falsch: Zurück in Fach 1 und sofort/morgen wiederholen
    newBox = 1
    nextReview.setDate(nextReview.getDate() + 0) // Heute noch mal
  }

  await supabase
    .from('user_vocabulary_progress')
    .update({ 
      box_number: newBox, 
      next_review_date: nextReview.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', progressId)
    .eq('user_id', user.id)

  revalidatePath('/[lang]/dashboard/vocabulary', 'layout')
  return { success: true, newBox }
}

export async function getLessonStats(level?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
  
    if (!user) return []
  
    // Wir holen alle Karten und den User Fortschritt
    let cardsQuery = supabase.from('vocabulary_cards').select('id, lesson')
    if (level) {
      cardsQuery = cardsQuery.eq('level', level)
    }
    const { data: cards } = await cardsQuery
    
    const { data: progress } = await supabase.from('user_vocabulary_progress').select('card_id, box_number').eq('user_id', user.id)

    if (!cards) return []

    const progressMap = new Map(progress?.map(p => [p.card_id, p.box_number]) || [])
    
    // Nach Lektionen gruppieren
    const stats: Record<string, { total: number, active: number, learned: number }> = {}

    cards.forEach(card => {
        if (!stats[card.lesson]) stats[card.lesson] = { total: 0, active: 0, learned: 0 }
        stats[card.lesson].total++

        const box = progressMap.get(card.id)
        if (box !== undefined) {
            if (box === 7) stats[card.lesson].learned++
            else stats[card.lesson].active++
        }
    })

    return Object.entries(stats).map(([lesson, data]) => ({
        lesson,
        ...data
    }))
}
