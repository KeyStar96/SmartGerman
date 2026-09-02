import { createClient } from '@/utils/supabase/client'

/**
 * Zentraler Upload-Pfad für Sprachaufnahmen.
 *
 * Die Pfad-Schemata sind absichtlich unverändert gegenüber der bisherigen
 * Inline-Logik, damit die bestehenden Storage-Policies weiter greifen:
 *   Schüler   `{userId}-{timestamp}.{ext}`
 *   Lehrkraft `feedback/{submissionId}_{timestamp}.{ext}`
 */

export const AUDIO_BUCKET = 'audio_submissions'

/** Dateiendung passend zum aufgenommenen MIME-Type. */
export function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

export type AudioUploadResult =
  | { success: true; publicUrl: string }
  | { success: false; reason: 'not_authenticated' | 'upload_failed' }

async function uploadToBucket(blob: Blob, buildPath: (userId: string) => string): Promise<AudioUploadResult> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('Audio-Upload ohne angemeldeten Nutzer abgebrochen.')
      return { success: false, reason: 'not_authenticated' }
    }

    const path = buildPath(user.id)
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(path, blob, { contentType: blob.type })

    if (error) {
      console.error('Audio-Upload fehlgeschlagen:', error.message)
      return { success: false, reason: 'upload_failed' }
    }

    const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path)
    return { success: true, publicUrl: data.publicUrl }
  } catch (err) {
    console.error('Unerwarteter Fehler beim Audio-Upload:', err)
    return { success: false, reason: 'upload_failed' }
  }
}

/** Aufnahme eines Schülers zur Korrektur. */
export function uploadStudentRecording(blob: Blob): Promise<AudioUploadResult> {
  const ext = extensionForMimeType(blob.type)
  return uploadToBucket(blob, (userId) => `${userId}-${Date.now()}.${ext}`)
}

/** Sprachnachricht der Lehrkraft zu einer Einreichung. */
export function uploadFeedbackRecording(blob: Blob, submissionId: string): Promise<AudioUploadResult> {
  const ext = extensionForMimeType(blob.type)
  return uploadToBucket(blob, () => `feedback/${submissionId}_${Date.now()}.${ext}`)
}
