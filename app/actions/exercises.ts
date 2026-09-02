'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { buildFillInBlankChips, scoreForAttempts } from '@/lib/exercise-chips'
import {
  parseFillInBlankContent,
  parseMultipleChoiceContent,
  type RecordExerciseAttemptInput,
  type RecordExerciseAttemptResult,
  type StudentExercise,
} from '@/lib/types/exercise'
import type { Database } from '@/supabase/database.types'

type ExerciseRow = Database['public']['Tables']['exercises']['Row']

interface EmbeddedProgress {
  completed: boolean | null
  score: number | null
  attempts: number | null
}

type ExerciseWithProgress = ExerciseRow & {
  user_exercise_progress: EmbeddedProgress[] | null
}

interface VocabularyMatch {
  article: string | null
  audioUrl: string | null
}

function normalizeWord(value: string): string {
  return value.trim().toLocaleLowerCase('de-DE')
}

function resolveContrastiveHint(exercise: ExerciseRow, nativeLanguage: string | null): string | null {
  if (nativeLanguage === 'Russisch' && exercise.hint_ru) return exercise.hint_ru
  if (nativeLanguage === 'Türkisch' && exercise.hint_tr) return exercise.hint_tr
  return null
}

function readProgress(progress: EmbeddedProgress[] | null): {
  completed: boolean
  score: number
  attempts: number
} {
  const entry = progress && progress.length > 0 ? progress[0] : null
  return {
    completed: entry?.completed ?? false,
    score: entry?.score ?? 0,
    attempts: entry?.attempts ?? 0,
  }
}

/**
 * Sucht Artikel und Audio-Spur zu den Lückentext-Lösungen in der Vokabelbank.
 * Der Artikel speist den Genus-Hinweis, die Audio-URL den Tap-to-Listen-Button.
 */
async function loadVocabularyMatches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  words: readonly string[]
): Promise<Map<string, VocabularyMatch>> {
  const matches = new Map<string, VocabularyMatch>()
  if (words.length === 0) return matches

  const { data, error } = await supabase
    .from('vocabulary_cards')
    .select('word_de, article, audio_url')
    .in('word_de', [...words])

  if (error) {
    console.error('Fehler beim Abrufen der Vokabel-Metadaten für Übungen:', error.message)
    return matches
  }

  for (const card of data ?? []) {
    matches.set(normalizeWord(card.word_de), {
      article: card.article,
      audioUrl: card.audio_url,
    })
  }

  return matches
}

/**
 * Lädt alle Übungen eines Sprachniveaus und bereitet sie für die UI auf:
 * Tipp-Chips, kontrastive Hinweise, Audio-Spur und Fortschritt sind aufgelöst.
 * Nicht darstellbare oder fehlerhaft gepflegte Inhalte werden ausgefiltert,
 * damit dem Lernenden niemals eine leere Übungskarte gezeigt wird.
 */
export async function getExercises(level?: string): Promise<StudentExercise[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('native_language')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profil für Übungshinweise nicht ladbar:', profileError.message)
    }

    let query = supabase
      .from('exercises')
      .select('*, user_exercise_progress (completed, score, attempts)')
      .order('lesson', { ascending: true })

    if (level) {
      query = query.eq('level', level)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fehler beim Abrufen der Übungen:', error.message)
      return []
    }

    const rows = (data ?? []) as ExerciseWithProgress[]
    const nativeLanguage = profile?.native_language ?? null

    // Lösungen der Lückentexte vorab sammeln: für Geschwister-Distraktoren
    // und für den Abgleich mit der Vokabelbank.
    const answersByTopic = new Map<string, string[]>()
    const allAnswers: string[] = []

    for (const row of rows) {
      if (row.type !== 'fill_in_blank') continue
      const content = parseFillInBlankContent(row.content)
      if (!content) continue

      const answer = content.correct_answer.trim()
      allAnswers.push(answer)
      const bucket = answersByTopic.get(row.topic)
      if (bucket) {
        bucket.push(answer)
      } else {
        answersByTopic.set(row.topic, [answer])
      }
    }

    const vocabularyMatches = await loadVocabularyMatches(supabase, allAnswers)

    const exercises: StudentExercise[] = []

    for (const row of rows) {
      const progress = readProgress(row.user_exercise_progress)
      const hint = resolveContrastiveHint(row, nativeLanguage)

      if (row.type === 'fill_in_blank') {
        const content = parseFillInBlankContent(row.content)
        if (!content) {
          console.error(`Übung ${row.id} hat einen ungültigen Lückentext-Inhalt und wird übersprungen.`)
          continue
        }

        const siblingAnswers = (answersByTopic.get(row.topic) ?? []).filter(
          (answer) => normalizeWord(answer) !== normalizeWord(content.correct_answer)
        )

        const chips = buildFillInBlankChips({
          exerciseId: row.id,
          correctAnswer: content.correct_answer,
          authoredOptions: content.options,
          siblingAnswers,
        })

        if (chips.length === 0) {
          console.error(`Übung ${row.id} liefert keine Auswahl-Chips und wird übersprungen.`)
          continue
        }

        const match = vocabularyMatches.get(normalizeWord(content.correct_answer))

        exercises.push({
          id: row.id,
          lesson: row.lesson,
          topic: row.topic,
          level: row.level,
          type: 'fill_in_blank',
          content,
          chips,
          solutionAudioUrl: row.solution_audio_url ?? match?.audioUrl ?? null,
          solutionArticle: match?.article ?? null,
          hint,
          completed: progress.completed,
          score: progress.score,
          attempts: progress.attempts,
        })
        continue
      }

      if (row.type === 'multiple_choice') {
        const content = parseMultipleChoiceContent(row.content)
        if (!content) {
          console.error(`Übung ${row.id} hat einen ungültigen Multiple-Choice-Inhalt und wird übersprungen.`)
          continue
        }

        exercises.push({
          id: row.id,
          lesson: row.lesson,
          topic: row.topic,
          level: row.level,
          type: 'multiple_choice',
          content,
          hint,
          completed: progress.completed,
          score: progress.score,
          attempts: progress.attempts,
        })
        continue
      }

      // sentence_building ist im Schema angelegt, aber noch nicht als UI umgesetzt.
      console.warn(`Übungstyp "${row.type}" wird derzeit nicht dargestellt (Übung ${row.id}).`)
    }

    return exercises
  } catch (err) {
    console.error('Unerwarteter Fehler in getExercises:', err)
    return []
  }
}

/**
 * Schreibt einen Antwortversuch fort. Eine Übung gilt erst als abgeschlossen,
 * wenn sie richtig gelöst wurde – falsche Versuche erhöhen nur den Zähler und
 * schalten dadurch die Smart Hints frei.
 *
 * Bewusst ohne revalidatePath: Ein Refresh mitten im Übungsdurchlauf würde die
 * Übungsliste neu filtern und den Lernenden aus dem Kontext reißen.
 */
export async function recordExerciseAttempt(
  input: RecordExerciseAttemptInput
): Promise<RecordExerciseAttemptResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { success: false, attempts: 0 }

    const { data: existing, error: readError } = await supabase
      .from('user_exercise_progress')
      .select('attempts, completed, score, hint_shown')
      .eq('user_id', user.id)
      .eq('exercise_id', input.exerciseId)
      .maybeSingle()

    if (readError) {
      console.error(
        `Fehler beim Lesen des Übungsfortschritts (User ${user.id}, Übung ${input.exerciseId}):`,
        readError.message
      )
      return { success: false, attempts: 0 }
    }

    const attempts = (existing?.attempts ?? 0) + 1
    const wasCompleted = existing?.completed ?? false
    const previousScore = existing?.score ?? 0

    const { error: writeError } = await supabase.from('user_exercise_progress').upsert(
      {
        user_id: user.id,
        exercise_id: input.exerciseId,
        attempts,
        hint_shown: input.hintShown || (existing?.hint_shown ?? false),
        completed: input.isCorrect || wasCompleted,
        score: input.isCorrect ? Math.max(previousScore, scoreForAttempts(attempts)) : previousScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, exercise_id' }
    )

    if (writeError) {
      console.error(
        `Fehler beim Speichern des Übungsfortschritts (User ${user.id}, Übung ${input.exerciseId}):`,
        writeError.message
      )
      return { success: false, attempts: 0 }
    }

    return { success: true, attempts }
  } catch (err) {
    console.error('Unerwarteter Fehler in recordExerciseAttempt:', err)
    return { success: false, attempts: 0 }
  }
}

/**
 * Wird aufgerufen, sobald ein Übungsdurchlauf beendet ist. Erst hier werden die
 * Fortschrittsanzeigen neu berechnet, damit während des Übens nichts umspringt.
 */
export async function finishExerciseSession(level: string): Promise<{ success: boolean }> {
  try {
    revalidatePath('/[lang]/dashboard', 'page')
    revalidatePath('/[lang]/dashboard/level/[level]', 'page')
    revalidatePath('/[lang]/dashboard/level/[level]/exercises', 'page')
    return { success: true }
  } catch (err) {
    console.error(`Unerwarteter Fehler in finishExerciseSession (Level ${level}):`, err)
    return { success: false }
  }
}

/** Nur noch als Kompatibilitätsschicht – neue Aufrufer nutzen recordExerciseAttempt. */
export async function saveExerciseProgress(
  exerciseId: string,
  isCorrect: boolean
): Promise<{ success: boolean }> {
  const result = await recordExerciseAttempt({ exerciseId, isCorrect, hintShown: false })
  return { success: result.success }
}
