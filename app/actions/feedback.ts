'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import nodemailer from 'nodemailer'
import { createClient } from '@/utils/supabase/server'
import type {
  FeedbackActionResult,
  StudentSubmission,
  SubmissionParent,
  SubmitAudioInput,
  SubmitTeacherFeedbackInput,
  TeacherSubmission,
  UnseenFeedbackSummary,
} from '@/lib/types/feedback'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/** Die Aussprache-Seite hängt am Sprachniveau, deshalb beide Segmente. */
const PRONUNCIATION_PATH = '/[lang]/dashboard/level/[level]/pronunciation'
const DASHBOARD_PATH = '/[lang]/dashboard'

export async function submitAudioUrl(input: SubmitAudioInput): Promise<FeedbackActionResult> {
  try {
    if (!input.url) return { success: false, reason: 'invalid_input' }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, reason: 'not_authenticated' }

    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      type: 'audio',
      content_url: input.url,
      status: 'pending',
      parent_id: input.parentId ?? null,
      attempt_number: input.attemptNumber ?? 1,
      level: input.level ?? 'A1.1',
    })

    if (error) {
      console.error(`Einreichung für Nutzer ${user.id} fehlgeschlagen:`, error.message)
      return { success: false, reason: 'save_failed' }
    }

    revalidatePath(PRONUNCIATION_PATH, 'page')
    revalidatePath(DASHBOARD_PATH, 'page')
    return { success: true }
  } catch (err) {
    console.error('Unerwarteter Fehler in submitAudioUrl:', err)
    return { success: false, reason: 'save_failed' }
  }
}

export async function getStudentSubmissions(level?: string): Promise<StudentSubmission[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    let query = supabase
      .from('submissions')
      .select(
        `
        id,
        content_url,
        text_content,
        status,
        created_at,
        level,
        attempt_number,
        teacher_feedback (
          feedback_text,
          feedback_audio_url,
          created_at,
          seen_at
        ),
        children:submissions!parent_id (id)
      `
      )
      .eq('user_id', user.id)

    if (level) query = query.eq('level', level)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error(`Einreichungen von Nutzer ${user.id} nicht ladbar:`, error.message)
      return []
    }

    return (data ?? []).map((row) => {
      const feedback = row.teacher_feedback ?? []
      // Supabase typisiert das selbstreferenzierende `children`-Embed je nach
      // Kardinalität als Objekt oder Array – deshalb der explizite Check.
      const children = Array.isArray(row.children) ? row.children : row.children ? [row.children] : []

      return {
        id: row.id,
        content_url: row.content_url,
        text_content: row.text_content,
        status: row.status,
        created_at: row.created_at,
        level: row.level,
        attempt_number: row.attempt_number ?? 1,
        teacher_feedback: feedback,
        hasResubmission: children.length > 0,
        hasUnseenFeedback: feedback.some((entry) => entry.seen_at === null),
      }
    })
  } catch (err) {
    console.error('Unerwarteter Fehler in getStudentSubmissions:', err)
    return []
  }
}

/**
 * Zählt Rückmeldungen, die der Schüler noch nicht geöffnet hat.
 * Speist die Dashboard-Karte „Du hast eine neue Sprachnachricht erhalten".
 */
export async function getUnseenFeedbackSummary(): Promise<UnseenFeedbackSummary> {
  const empty: UnseenFeedbackSummary = { count: 0, latestLevel: null }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return empty

    // RLS beschränkt teacher_feedback bereits auf eigene Einreichungen;
    // der Join auf submissions liefert zusätzlich das Sprachniveau.
    const { data, error } = await supabase
      .from('teacher_feedback')
      .select('created_at, submissions!inner (level, user_id)')
      .is('seen_at', null)
      .eq('submissions.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Ungelesenes Feedback für ${user.id} nicht ladbar:`, error.message)
      return empty
    }

    const rows = data ?? []
    if (rows.length === 0) return empty

    return {
      count: rows.length,
      latestLevel: rows[0]?.submissions?.level ?? null,
    }
  } catch (err) {
    console.error('Unerwarteter Fehler in getUnseenFeedbackSummary:', err)
    return empty
  }
}

/**
 * Markiert das Feedback einer eigenen Einreichung als gelesen.
 *
 * Läuft über die SECURITY-DEFINER-Funktion `mark_feedback_seen`, damit der
 * Schüler keine UPDATE-Rechte auf `teacher_feedback` benötigt und den
 * Feedback-Text nicht verändern kann.
 */
export async function markFeedbackSeen(submissionId: string): Promise<FeedbackActionResult> {
  try {
    if (!submissionId) return { success: false, reason: 'invalid_input' }

    const supabase = await createClient()
    const { error } = await supabase.rpc('mark_feedback_seen', {
      p_submission_id: submissionId,
    })

    if (error) {
      console.error(`Feedback ${submissionId} nicht als gelesen markierbar:`, error.message)
      return { success: false, reason: 'save_failed' }
    }

    revalidatePath(DASHBOARD_PATH, 'page')
    return { success: true }
  } catch (err) {
    console.error('Unerwarteter Fehler in markFeedbackSeen:', err)
    return { success: false, reason: 'save_failed' }
  }
}

const TEACHER_SUBMISSION_SELECT = `
  id,
  user_id,
  type,
  content_url,
  text_content,
  status,
  created_at,
  level,
  parent_id,
  attempt_number,
  profiles:user_id (
    name,
    email,
    native_language
  ),
  teacher_feedback (
    feedback_text,
    feedback_audio_url,
    created_at,
    seen_at
  )
`

/**
 * Lädt die Vorgänger-Einreichungen inklusive ihres Feedbacks.
 *
 * Separate Abfrage, weil Supabase `teacher_feedback` innerhalb des
 * selbstreferenzierenden `parent`-Embeds nicht typisieren kann.
 */
async function loadSubmissionParents(
  supabase: SupabaseServerClient,
  parentIds: readonly string[]
): Promise<Map<string, SubmissionParent>> {
  const parents = new Map<string, SubmissionParent>()
  if (parentIds.length === 0) return parents

  const { data, error } = await supabase
    .from('submissions')
    .select(
      `
      id,
      content_url,
      created_at,
      attempt_number,
      teacher_feedback (
        feedback_text,
        feedback_audio_url,
        created_at,
        seen_at
      )
    `
    )
    .in('id', [...parentIds])

  if (error) {
    console.error('Fehler beim Laden der vorherigen Einreichungen:', error.message)
    return parents
  }

  for (const row of data ?? []) {
    parents.set(row.id, {
      id: row.id,
      content_url: row.content_url,
      created_at: row.created_at,
      attempt_number: row.attempt_number,
      teacher_feedback: row.teacher_feedback ?? [],
    })
  }

  return parents
}

async function loadTeacherSubmissions(
  status: 'pending' | 'reviewed'
): Promise<TeacherSubmission[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    // RLS (Lehrer) greift automatisch, zusätzlich filtern wir nach Status.
    const { data, error } = await supabase
      .from('submissions')
      .select(TEACHER_SUBMISSION_SELECT)
      .eq('status', status)
      .order('created_at', { ascending: status === 'pending' })

    if (error) {
      console.error(`Fehler beim Laden der Einreichungen (${status}):`, error.message)
      return []
    }

    const rows = data ?? []
    const parentIds = rows
      .map((row) => row.parent_id)
      .filter((parentId): parentId is string => typeof parentId === 'string')

    const parents = await loadSubmissionParents(supabase, parentIds)

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      content_url: row.content_url,
      text_content: row.text_content,
      status: row.status,
      created_at: row.created_at,
      level: row.level,
      parent_id: row.parent_id,
      attempt_number: row.attempt_number,
      profiles: row.profiles,
      teacher_feedback: row.teacher_feedback ?? [],
      parent: row.parent_id ? parents.get(row.parent_id) ?? null : null,
    }))
  } catch (err) {
    console.error(`Unerwarteter Fehler beim Laden der Einreichungen (${status}):`, err)
    return []
  }
}

export async function getPendingSubmissions(): Promise<TeacherSubmission[]> {
  return loadTeacherSubmissions('pending')
}

export async function getCompletedSubmissions(): Promise<TeacherSubmission[]> {
  return loadTeacherSubmissions('reviewed')
}

/**
 * Benachrichtigt den Schüler per E-Mail. Fehler hier dürfen die Freigabe des
 * Feedbacks nicht verhindern – die Dashboard-Karte greift ohnehin.
 */
async function notifyStudentByEmail(
  supabase: SupabaseServerClient,
  submissionId: string
): Promise<void> {
  if (!process.env.SMTP_HOST) return

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('level, profiles:user_id (email, name)')
      .eq('id', submissionId)
      .single()

    if (error || !data?.profiles?.email) return

    const studentEmail = data.profiles.email
    const studentName = data.profiles.name ?? 'Schüler'

    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    try {
      const headersList = await headers()
      const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
      const proto = headersList.get('x-forwarded-proto') ?? 'https'
      if (host) siteUrl = `${proto}://${host}`
    } catch {
      console.warn('Host-Header nicht lesbar, nutze konfigurierte Basis-URL.')
    }

    const dashUrl = `${siteUrl}/de/dashboard/level/${encodeURIComponent(data.level)}/pronunciation`

    const smtpFrom = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? ''
    const fromString =
      smtpFrom.includes('<') && smtpFrom.includes('>')
        ? smtpFrom
        : `"Sitov Language Academy" <${smtpFrom}>`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    await transporter.sendMail({
      from: fromString,
      to: studentEmail,
      subject: 'Du hast eine neue Sprachnachricht erhalten',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; font-size: 18px; line-height: 1.6;">
          <h2 style="color: #FF5C00; font-size: 24px;">Hallo ${studentName},</h2>
          <p>Deine Lehrkraft hat dir eine Rückmeldung zu deiner Sprachaufnahme hinterlegt.</p>
          <p>Du kannst sie dir jetzt in Ruhe anhören.</p>
          <a href="${dashUrl}" style="display: inline-block; background-color: #FF5C00; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; font-size: 18px;">
            Feedback anhören
          </a>
        </div>
      `,
    })
  } catch (err) {
    console.error(`E-Mail-Benachrichtigung zu Einreichung ${submissionId} fehlgeschlagen:`, err)
  }
}

export async function submitTeacherFeedback(
  input: SubmitTeacherFeedbackInput
): Promise<FeedbackActionResult> {
  try {
    const feedbackText = input.feedbackText.trim()
    if (!input.submissionId || (!feedbackText && !input.feedbackAudioUrl)) {
      return { success: false, reason: 'invalid_input' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, reason: 'not_authenticated' }

    const { error: insertError } = await supabase.from('teacher_feedback').insert({
      submission_id: input.submissionId,
      teacher_id: user.id,
      feedback_text: feedbackText,
      feedback_audio_url: input.feedbackAudioUrl ?? null,
    })

    if (insertError) {
      console.error(
        `Feedback zu Einreichung ${input.submissionId} nicht gespeichert:`,
        insertError.message
      )
      return { success: false, reason: 'save_failed' }
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'reviewed' })
      .eq('id', input.submissionId)

    if (updateError) {
      console.error(
        `Status von Einreichung ${input.submissionId} nicht aktualisiert:`,
        updateError.message
      )
      return { success: false, reason: 'save_failed' }
    }

    await notifyStudentByEmail(supabase, input.submissionId)

    revalidatePath('/[lang]/admin/submissions', 'page')
    revalidatePath(PRONUNCIATION_PATH, 'page')
    revalidatePath(DASHBOARD_PATH, 'page')
    return { success: true }
  } catch (err) {
    console.error('Unerwarteter Fehler in submitTeacherFeedback:', err)
    return { success: false, reason: 'save_failed' }
  }
}
