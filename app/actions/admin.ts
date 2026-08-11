'use server'

import { createClient } from '@/utils/supabase/server'
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
  return supabase
}

export async function getAdminStats() {
  try {
    const supabase = await requireAdmin()
    
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
    const supabase = await requireAdmin()
    
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
    const supabase = await requireAdmin()
    
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
    const supabase = await requireAdmin()
    
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
