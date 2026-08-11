'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

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
}

export async function getAdminStats() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    // Get total students
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      
    // Get premium users
    const { count: premiumCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'aktiv')
      
    // Get pending submissions
    const { count: pendingSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      
    return {
      studentCount: studentCount || 0,
      premiumCount: premiumCount || 0,
      pendingSubmissions: pendingSubmissions || 0
    }
  } catch (error) {
    console.error('Error fetching admin stats', error)
    return { studentCount: 0, premiumCount: 0, pendingSubmissions: 0 }
  }
}

export async function getStudents() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching students', error)
    return []
  }
}

export async function updateStudentRole(userId: string, role: string) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      
    if (error) throw error
    
    revalidatePath('/[lang]/admin/students', 'page')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating role', error)
    return { success: false, error: error.message }
  }
}

export async function updateStudentSubscription(userId: string, status: string) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_status: status })
      .eq('id', userId)
      
    if (error) throw error
    
    revalidatePath('/[lang]/admin/students', 'page')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating subscription', error)
    return { success: false, error: error.message }
  }
}

export async function getAllStudentsProgressData() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    // 1. Hole alle Übungen und deren Level
    const { data: exercises } = await supabase.from('exercises').select('id, level')
    
    // 2. Hole alle Vokabelkarten und deren Level
    const { data: vocabCards } = await supabase.from('vocabulary_cards').select('id, level')

    // 3. Hole den Fortschritt ALLER User für Übungen
    const { data: exerciseProgress } = await supabase
      .from('user_exercise_progress')
      .select('user_id, exercise_id')
      .eq('completed', true)

    // 4. Hole den Fortschritt ALLER User für Vokabeln (Box 7 = gemeistert)
    const { data: vocabProgress } = await supabase
      .from('user_vocabulary_progress')
      .select('user_id, card_id')
      .eq('box_number', 7)

    // Maps
    const exerciseLevelMap = new Map((exercises || []).map(e => [e.id, e.level]))
    const vocabLevelMap = new Map((vocabCards || []).map(v => [v.id, v.level]))

    // Total per level
    const totalPerLevel: Record<string, number> = {}
    exercises?.forEach(e => { totalPerLevel[e.level] = (totalPerLevel[e.level] || 0) + 1 })
    vocabCards?.forEach(v => { totalPerLevel[v.level] = (totalPerLevel[v.level] || 0) + 1 })

    // Completed per user per level
    const userCompletedPerLevel: Record<string, Record<string, number>> = {}
    
    exerciseProgress?.forEach(p => {
      const level = exerciseLevelMap.get(p.exercise_id)
      if (level) {
        if (!userCompletedPerLevel[p.user_id]) userCompletedPerLevel[p.user_id] = {}
        userCompletedPerLevel[p.user_id][level] = (userCompletedPerLevel[p.user_id][level] || 0) + 1
      }
    })

    vocabProgress?.forEach(p => {
      const level = vocabLevelMap.get(p.card_id)
      if (level) {
        if (!userCompletedPerLevel[p.user_id]) userCompletedPerLevel[p.user_id] = {}
        userCompletedPerLevel[p.user_id][level] = (userCompletedPerLevel[p.user_id][level] || 0) + 1
      }
    })

    // Compute percentages
    const result: Record<string, Record<string, number>> = {}
    Object.keys(userCompletedPerLevel).forEach(userId => {
      result[userId] = {}
      Object.keys(totalPerLevel).forEach(level => {
        const total = totalPerLevel[level] || 0
        if (total > 0) {
          const completed = userCompletedPerLevel[userId][level] || 0
          result[userId][level] = Math.round((completed / total) * 100)
        }
      })
    })

    return result
  } catch (error) {
    console.error('Error fetching progress data for all students', error)
    return {}
  }
}
