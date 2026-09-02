'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { toJsonContent, type AddExerciseInput } from '@/lib/types/exercise'

// Helper to check if current user is admin/teacher
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
    throw new Error('Not authorized')
  }
  return supabase
}

// -------------------------------------------------------------
// VOCABULARY
// -------------------------------------------------------------
export async function getVocabs() {
  const supabase = await requireAdmin()
  const { data, error } = await supabase.from('vocabulary_cards').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addVocab(payload: any) {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase.from('vocabulary_cards').insert([payload])
    if (error) throw error
    revalidatePath('/[lang]/admin/content/vocabulary', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteVocab(id: string) {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase.from('vocabulary_cards').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/[lang]/admin/content/vocabulary', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------------
// VIDEOS
// -------------------------------------------------------------
export async function getVideos() {
  const supabase = await requireAdmin()
  const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addVideo(payload: any) {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase.from('videos').insert([payload])
    if (error) throw error
    revalidatePath('/[lang]/admin/content/videos', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteVideo(id: string) {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/[lang]/admin/content/videos', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------------
// EXERCISES
// -------------------------------------------------------------
export async function getExercises() {
  const supabase = await requireAdmin()
  const { data, error } = await supabase.from('exercises').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addExercise(payload: AddExerciseInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase.from('exercises').insert([
      {
        level: payload.level,
        lesson: payload.lesson,
        topic: payload.topic,
        type: payload.type,
        hint_ru: payload.hint_ru,
        hint_tr: payload.hint_tr,
        solution_audio_url: payload.solution_audio_url,
        content: toJsonContent(payload.content),
      },
    ])
    if (error) throw error
    revalidatePath('/[lang]/admin/content/exercises', 'page')
    return { success: true }
  } catch (err) {
    console.error('Fehler beim Anlegen einer Übung:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Die Übung konnte nicht gespeichert werden.',
    }
  }
}

export async function deleteExercise(id: string) {
  try {
    const supabase = await requireAdmin()
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/[lang]/admin/content/exercises', 'page')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
