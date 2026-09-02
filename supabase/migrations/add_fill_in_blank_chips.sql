-- ============================================================================
-- SmartGerman v2 – Migration: Lückentext-Modul (Tipp-Chips, Smart Hints, Audio)
-- Projekt: wcaslabeiwtvygxtzcio
--
-- Rückwärtskompatibel: ausschließlich additive Spalten mit Defaults.
-- Keine bestehende Spalte, kein Trigger, keine RLS-Policy wird verändert.
-- Idempotent: kann mehrfach ausgeführt werden (IF NOT EXISTS).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Versuchszähler für die Smart-Hints-Logik
--    Nach 2 Fehlversuchen erscheint ein dezenter Hinweis. Der Zähler wird
--    persistiert, damit der Hinweis auch nach Seiten-Reload korrekt greift.
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_exercise_progress
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.user_exercise_progress
  ADD COLUMN IF NOT EXISTS hint_shown boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_exercise_progress.attempts IS
  'Anzahl der Antwortversuche. Ab 2 Fehlversuchen wird ein Smart Hint eingeblendet.';
COMMENT ON COLUMN public.user_exercise_progress.hint_shown IS
  'True, sobald dem Lernenden ein Smart Hint gezeigt wurde (Lehrer-Analytics).';

-- ----------------------------------------------------------------------------
-- 2) Optionale native Audio-Spur für die Lösung des Lückentextes
--    Fällt im Client auf vocabulary_cards.audio_url und danach auf die
--    Web-Speech-API zurück, bleibt also überall optional.
-- ----------------------------------------------------------------------------
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS solution_audio_url text;

COMMENT ON COLUMN public.exercises.solution_audio_url IS
  'Optionale MP3-URL für die native Aussprache der Lösung (Tap-to-Listen).';

-- ----------------------------------------------------------------------------
-- 3) Score-Bereich absichern (gestaffelte Punkte je nach Versuchszahl)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_exercise_progress_score_range'
  ) THEN
    ALTER TABLE public.user_exercise_progress
      ADD CONSTRAINT user_exercise_progress_score_range
      CHECK (score IS NULL OR (score >= 0 AND score <= 100));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4) Index für Fortschritts-Auswertungen (Dashboard & Lehrer-Ansicht)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_exercise_progress_user_completed
  ON public.user_exercise_progress USING btree (user_id, completed);

CREATE INDEX IF NOT EXISTS idx_exercises_level_lesson
  ON public.exercises USING btree (level, lesson);

COMMIT;
