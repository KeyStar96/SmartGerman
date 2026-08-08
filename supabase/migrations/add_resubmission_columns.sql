-- Fügt die parent_id und attempt_number Spalten zur Tabelle submissions hinzu
-- Dies ermöglicht "Zweiter Versuch"-Funktionen für Sprachübungen.

ALTER TABLE public.submissions
ADD COLUMN parent_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
ADD COLUMN attempt_number integer DEFAULT 1;

-- Index für schnellere Lookups der parent_id
CREATE INDEX IF NOT EXISTS submissions_parent_id_idx ON public.submissions(parent_id);
