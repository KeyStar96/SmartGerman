-- ============================================================================
-- SmartGerman v2 – Migration: Phase-6-Leitner-Prinzip für den Vokabeltrainer
-- Projekt: wcaslabeiwtvygxtzcio
--
-- Rückwärtskompatibel:
--   * `box_number` behält seinen Wertebereich 1..7 (1–6 = Lernphasen,
--     7 = dauerhaft gelernt). Bestehende Lernstände werden 1:1 übernommen.
--   * Nur additive Spalten mit Defaults, keine Spalte wird entfernt.
--   * Die Neuberechnung der Termine kann keine fällige Vokabel verschlucken:
--     bereits fällige Karten bleiben unangetastet, künftige Termine werden
--     höchstens nach vorne gezogen (LEAST).
-- Idempotent: mehrfach ausführbar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Telemetrie zur Fehler-Regel
--    `lapses` zählt, wie oft eine Vokabel eine Phase zurückgerutscht ist.
--    Das ist die Grundlage, um `is_hard_for_ru` / `is_hard_for_tr` künftig
--    datenbasiert zu pflegen.
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_vocabulary_progress
  ADD COLUMN IF NOT EXISTS lapses integer NOT NULL DEFAULT 0;

ALTER TABLE public.user_vocabulary_progress
  ADD COLUMN IF NOT EXISTS last_answered_at timestamp with time zone;

COMMENT ON COLUMN public.user_vocabulary_progress.box_number IS
  'Phase-6-Leitner: 1–6 = aktive Lernphasen, 7 = dauerhaft gelernt (wird nicht mehr abgefragt).';
COMMENT ON COLUMN public.user_vocabulary_progress.lapses IS
  'Anzahl der Rückstufungen um eine Phase (falsche Antworten).';
COMMENT ON COLUMN public.user_vocabulary_progress.last_answered_at IS
  'Zeitpunkt der letzten Antwort – für Lehrer-Auswertungen und Lernstreaks.';

-- ----------------------------------------------------------------------------
-- 2) Index für die Abfrage der fälligen Karten
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_progress_due
  ON public.user_vocabulary_progress USING btree (user_id, next_review_date, box_number);

-- ----------------------------------------------------------------------------
-- 3) Termine auf die neuen Phase-6-Intervalle umrechnen
--    Alt: 0 / 1 / 2 / 4 / 10 / 30 / 90 / 365 Tage
--    Neu: Phase 1 = 1, Phase 2 = 1, Phase 3 = 3, Phase 4 = 9,
--         Phase 5 = 29, Phase 6 = 90 Tage
--
--    Die neuen Intervalle sind je Phase nie länger als die alten. `LEAST`
--    zieht zu lange Wartezeiten nach vorne, verlängert aber nie. Bereits
--    fällige Karten (`next_review_date <= now()`) bleiben fällig.
--
--    Die kontrastive Halbierung für schwere Vokabeln wird hier absichtlich
--    nicht angewandt – sie greift bei der nächsten Antwort in der Anwendung.
-- ----------------------------------------------------------------------------
UPDATE public.user_vocabulary_progress AS p
SET
  next_review_date = LEAST(p.next_review_date, now() + (v.days || ' days')::interval),
  updated_at = now()
FROM (
  VALUES (1, 1), (2, 1), (3, 3), (4, 9), (5, 29), (6, 90), (7, 90)
) AS v(box, days)
WHERE p.box_number = v.box
  AND p.next_review_date > now();

COMMIT;
