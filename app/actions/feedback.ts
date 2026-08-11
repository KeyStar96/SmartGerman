'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import nodemailer from 'nodemailer'

export async function submitAudioUrl(url: string, parentId?: string, attemptNumber: number = 1, level?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      type: 'audio',
      content_url: url,
      status: 'pending',
      parent_id: parentId || null,
      attempt_number: attemptNumber,
      level: level || 'A1.1'
    })

  if (error) {
    console.error('Error submitting audio:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/[lang]/dashboard/pronunciation', 'page')
  return { success: true }
}

export async function getStudentSubmissions(level?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  let query = supabase
    .from('submissions')
    .select(`
      *,
      teacher_feedback (
        feedback_text,
        feedback_audio_url,
        created_at
      ),
      children:submissions!parent_id(id)
    `)
    .eq('user_id', user.id)
    
  if (level) {
    query = query.eq('level', level)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

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
      ),
      parent:parent_id (
        *,
        teacher_feedback (*)
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

export async function submitTeacherFeedback(submissionId: string, feedbackText: string, feedbackAudioUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Insert feedback
  const { error: insertError } = await supabase
    .from('teacher_feedback')
    .insert({
      submission_id: submissionId,
      teacher_id: user.id,
      feedback_text: feedbackText || '',
      feedback_audio_url: feedbackAudioUrl || null
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

  // Fetch student email to send notification
  const { data: submissionData } = await supabase
    .from('submissions')
    .select('user_id, profiles:user_id(email, name)')
    .eq('id', submissionId)
    .single()

  const profiles = submissionData?.profiles as any
  const studentEmail = profiles?.email
  const studentName = profiles?.name || 'Schüler'

  if (studentEmail && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      try {
        const headersList = await headers()
        const host = headersList.get('x-forwarded-host') || headersList.get('host')
        const proto = headersList.get('x-forwarded-proto') || 'https'
        if (host) {
          siteUrl = `${proto}://${host}`
        }
      } catch (e) {
        console.warn('Could not read headers for site URL fallback.')
      }
      
      const dashUrl = `${siteUrl}/de/dashboard/pronunciation`

      let smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || ''
      let fromString = `"Sitov Language Academy" <${smtpFrom}>`
      // Falls SMTP_FROM bereits formatierte Absender enthält (z.B. "Name <email@domain.de>")
      if (smtpFrom.includes('<') && smtpFrom.includes('>')) {
        fromString = smtpFrom
      }

      await transporter.sendMail({
        from: fromString,
        to: studentEmail,
        subject: 'Neues Feedback zu deiner Sprachaufnahme verfügbar! 🎙️',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF5C00;">Hallo ${studentName},</h2>
            <p>Deine Lehrkraft hat soeben eine neue Auswertung (Text/Audio) zu deiner Sprachaufnahme hinterlegt.</p>
            <p>Höre dir jetzt das Feedback an und verbessere deine Aussprache weiter!</p>
            <a href="${dashUrl}" style="display: inline-block; background-color: #FF5C00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
              Jetzt Feedback ansehen
            </a>
          </div>
        `
      })
    } catch (emailErr) {
      console.error('Error sending email notification:', emailErr)
    }
  }

  revalidatePath('/[lang]/admin/submissions', 'page')
  return { success: true }
}

export async function getCompletedSubmissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      profiles:user_id (
        name,
        email,
        native_language
      ),
      teacher_feedback (
        feedback_text,
        feedback_audio_url,
        created_at
      ),
      parent:parent_id (
        *,
        teacher_feedback (*)
      )
    `)
    .eq('status', 'reviewed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching completed submissions:', error)
    return []
  }

  return data
}
