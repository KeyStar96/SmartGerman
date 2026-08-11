'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAllLevelsProgress() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return {}

  // 1. Hole alle Übungen und deren Level
  const { data: exercises } = await supabase.from('exercises').select('id, level')
  
  // 2. Hole alle Vokabelkarten und deren Level
  const { data: vocabCards } = await supabase.from('vocabulary_cards').select('id, level')

  // 3. Hole den Fortschritt des Users für Übungen
  const { data: exerciseProgress } = await supabase
    .from('user_exercise_progress')
    .select('exercise_id')
    .eq('user_id', user.id)
    .eq('completed', true)

  // 4. Hole den Fortschritt des Users für Vokabeln (Box 7 = gemeistert)
  const { data: vocabProgress } = await supabase
    .from('user_vocabulary_progress')
    .select('card_id')
    .eq('user_id', user.id)
    .eq('box_number', 7)

  // Map IDs to Level
  const exerciseLevelMap = new Map((exercises || []).map(e => [e.id, e.level]))
  const vocabLevelMap = new Map((vocabCards || []).map(v => [v.id, v.level]))

  // Total items per level
  const totalPerLevel: Record<string, number> = {}
  exercises?.forEach(e => {
    totalPerLevel[e.level] = (totalPerLevel[e.level] || 0) + 1
  })
  vocabCards?.forEach(v => {
    totalPerLevel[v.level] = (totalPerLevel[v.level] || 0) + 1
  })

  // Completed items per level
  const completedPerLevel: Record<string, number> = {}
  exerciseProgress?.forEach(p => {
    const level = exerciseLevelMap.get(p.exercise_id)
    if (level) {
      completedPerLevel[level] = (completedPerLevel[level] || 0) + 1
    }
  })
  vocabProgress?.forEach(p => {
    const level = vocabLevelMap.get(p.card_id)
    if (level) {
      completedPerLevel[level] = (completedPerLevel[level] || 0) + 1
    }
  })

  // Calculate percentages
  const progressPercentages: Record<string, number> = {}
  
  // Initialize all known levels with 0%
  Object.keys(totalPerLevel).forEach(level => {
    progressPercentages[level] = 0
  })

  // Calculate actual percentage
  Object.keys(totalPerLevel).forEach(level => {
    const total = totalPerLevel[level] || 0
    if (total > 0) {
      const completed = completedPerLevel[level] || 0
      progressPercentages[level] = Math.round((completed / total) * 100)
    }
  })

  return progressPercentages
}
