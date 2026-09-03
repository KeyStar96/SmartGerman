-- ============================================================================
-- Sitov Academy v2 – Migration: Benachrichtigungen für Lehrer-Feedback
-- Projekt: wcaslabeiwtvygxtzcio
--
-- Rückwärtskompatibel:
--   * Nur eine additive Spalte (`seen_at`, nullable) und zwei Indizes.
--   * Bestehende RLS-Policies bleiben unverändert. Der Schüler erhält KEINE
--     UPDATE-Policy auf `teacher_feedback`; das Setzen von `seen_at` läuft
--     über eine SECURITY-DEFINER-Funktion, damit der Feedback-Text für den
--     Schüler unveränderlich bleibt.
--   * Keine Änderung an Triggern, Edge Functions oder Zahlungsflüssen.
-- Idempotent: mehrfach ausführbar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Gelesen-Status pro Feedback-Eintrag
--    NULL bedeutet „neue Sprachnachricht" und speist die Dashboard-Karte.
-- ----------------------------------------------------------------------------
ALTER TABLE public.teacher_feedback
  ADD COLUMN IF NOT EXISTS seen_at timestamp with time zone;

COMMENT ON COLUMN public.teacher_feedback.seen_at IS
  'Zeitpunkt, an dem der Schüler das Feedback geöffnet hat. NULL = neue Sprachnachricht.';

-- Partieller Index: die Benachrichtigungs-Abfrage liest nur ungelesene Zeilen.
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_unseen
  ON public.teacher_feedback USING btree (submission_id)
  WHERE seen_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_user_level_created
  ON public.submissions USING btree (user_id, level, created_at DESC);

-- ----------------------------------------------------------------------------
-- 2) Kontrollierter Schreibzugriff für den Schüler
--    Die Funktion setzt ausschließlich `seen_at` und ausschließlich für
--    Einreichungen, die dem aufrufenden Nutzer gehören.
-- ----------------------------------------------------------------------------
-- `search_path = ''` erzwingt vollqualifizierte Namen und verhindert, dass
-- ein untergeschobenes Schema die Funktion umlenkt.
CREATE OR REPLACE FUNCTION public.mark_feedback_seen(p_submission_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.teacher_feedback AS tf
  SET seen_at = now()
  WHERE tf.submission_id = p_submission_id
    AND tf.seen_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = tf.submission_id
        AND s.user_id = auth.uid()
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.mark_feedback_seen(uuid) IS
  'Markiert das Feedback einer eigenen Einreichung als gelesen. Setzt nur seen_at.';

REVOKE ALL ON FUNCTION public.mark_feedback_seen(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_feedback_seen(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_feedback_seen(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3) Backfill
--    Ohne diesen Schritt würde beim Rollout jeder Schüler eine Flut alter
--    Hinweise sehen. Feedback der letzten 7 Tage bleibt bewusst offen.
-- ----------------------------------------------------------------------------
UPDATE public.teacher_feedback
SET seen_at = created_at
WHERE seen_at IS NULL
  AND created_at < now() - interval '7 days';

COMMIT;
