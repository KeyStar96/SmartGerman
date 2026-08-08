'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExercises(lessonName?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Profil holen für die Erstsprache (wichtig für kontrastive Hinweise)
  const { data: profile } = await supabase
    .from('profiles')
    .select('native_language')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('exercises')
    .select(`
      *,
      user_exercise_progress (
        completed,
        score
      )
    `)
  
  if (lessonName) {
    query = query.eq('lesson', lessonName)
  }

  const { data: exercises, error } = await query

  if (error) {
    console.error('Fehler beim Abrufen der Übungen:', error)
    return []
  }

  // Für das Frontend aufbereiten
  return exercises.map((ex: any) => {
    // Fortschritt filtern für aktuellen User (durch RLS eigentlich schon gefiltert, aber Array entpacken)
    const progress = ex.user_exercise_progress && ex.user_exercise_progress.length > 0 
      ? ex.user_exercise_progress[0] 
      : { completed: false, score: 0 }

    // Bestimme, welcher Hinweis gezeigt werden soll, falls vorhanden
    let hint = null
    if (profile?.native_language === 'Russisch' && ex.hint_ru) {
      hint = ex.hint_ru
    } else if (profile?.native_language === 'Türkisch' && ex.hint_tr) {
      hint = ex.hint_tr
    }

    return {
      id: ex.id,
      lesson: ex.lesson,
      topic: ex.topic,
      type: ex.type,
      content: ex.content,
      hint, // Nur der für die Muttersprache relevante Hinweis wird übertragen
      completed: progress.completed,
      score: progress.score
    }
  })
}

export async function saveExerciseProgress(exerciseId: string, isCorrect: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  // Upsert Fortschritt
  const { error } = await supabase
    .from('user_exercise_progress')
    .upsert({
      user_id: user.id,
      exercise_id: exerciseId,
      completed: true,
      score: isCorrect ? 100 : 0, // Einfaches Score-System
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id, exercise_id'
    })

  if (error) {
    console.error('Fehler beim Speichern des Übungsfortschritts:', error)
    return { success: false }
  }

  revalidatePath('/[lang]/dashboard/exercises', 'page')
  return { success: true }
}
