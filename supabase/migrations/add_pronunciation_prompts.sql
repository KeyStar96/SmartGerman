-- Migration: add_pronunciation_prompts
-- Übungssätze des Aussprache-Trainers, nach CEFR-Familie (A1–C2).
-- Additiv: keine bestehenden Tabellen/Trigger/RLS werden verändert.
-- Zugriff: angemeldete Nutzer lesen; Schreiben nur Admin/Teacher.

CREATE TABLE IF NOT EXISTS public.pronunciation_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cefr_level text NOT NULL CHECK (cefr_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text])),
  sentence_de text NOT NULL,
  focus text,
  audio_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pronunciation_prompts_cefr_sort_idx
  ON public.pronunciation_prompts (cefr_level, sort_order);

ALTER TABLE public.pronunciation_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutzer können Übungssätze sehen"
  ON public.pronunciation_prompts FOR SELECT TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins und Lehrer dürfen Übungssätze einfügen"
  ON public.pronunciation_prompts FOR INSERT TO public
  WITH CHECK ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));

CREATE POLICY "Admins und Lehrer dürfen Übungssätze bearbeiten"
  ON public.pronunciation_prompts FOR UPDATE TO public
  USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));

CREATE POLICY "Admins und Lehrer dürfen Übungssätze löschen"
  ON public.pronunciation_prompts FOR DELETE TO public
  USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
