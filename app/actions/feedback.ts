'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitAudioUrl(url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      type: 'audio',
      content_url: url,
      status: 'pending'
    })

  if (error) {
    console.error('Error submitting audio:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/[lang]/dashboard/pronunciation', 'page')
  return { success: true }
}

export async function getStudentSubmissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      teacher_feedback (
        feedback_text,
        feedback_audio_url,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching student submissions:', error)
    return []
  }

  return data
}

export async function getPendingSubmissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // RLS (Lehrer) greift automatisch, aber zur Sicherheit filtern wir nach pending
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:user_id (
        name,
        email,
        native_language
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending submissions:', error)
    return []
  }

  return data
}

export async function submitTeacherFeedback(submissionId: string, feedbackText: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Insert feedback
  const { error: insertError } = await supabase
    .from('teacher_feedback')
    .insert({
      submission_id: submissionId,
      teacher_id: user.id,
      feedback_text: feedbackText
    })

  if (insertError) {
    console.error('Error saving feedback:', insertError)
    return { success: false, error: insertError.message }
  }

  // Update submission status
  const { error: updateError } = await supabase
    .from('submissions')
    .update({ status: 'reviewed' })
    .eq('id', submissionId)

  if (updateError) {
    console.error('Error updating submission status:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath('/[lang]/admin/feedback', 'page')
  return { success: true }
}
