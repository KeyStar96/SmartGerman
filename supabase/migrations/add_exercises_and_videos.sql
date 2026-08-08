-- 1. Tabelle für Videos
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  lesson text NOT NULL,
  video_url text, -- Für zukünftige eigene Videos
  is_external boolean DEFAULT false, -- True für DW Nicos Weg
  external_url text, -- Link zu externem Video (DW)
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabelle für interaktive Übungen
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  topic text NOT NULL, -- z.B. "Akkusativ", "Artikel"
  type text NOT NULL CHECK (type IN ('fill_in_blank', 'multiple_choice', 'sentence_building')),
  content jsonb NOT NULL, -- Speichert Aufgabe, Lücken, Antwortmöglichkeiten, korrekte Lösung
  hint_ru text, -- Kontrastiver Hinweis für Russisch-Muttersprachler
  hint_tr text, -- Kontrastiver Hinweis für Türkisch-Muttersprachler
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabelle für den Fortschritt der Übungen
CREATE TABLE IF NOT EXISTS public.user_exercise_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  score integer, -- Optional (z.B. Punkte erreicht)
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- RLS für Videos und Übungen (Leserechte für alle angemeldeten Nutzer)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutzer können Videos sehen" ON public.videos FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutzer können Übungen sehen" ON public.exercises FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS für Lernfortschritt
ALTER TABLE public.user_exercise_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nutzer sehen eigenen Übungsfortschritt" ON public.user_exercise_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutzer können eigenen Übungsfortschritt anlegen" ON public.user_exercise_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutzer können eigenen Übungsfortschritt updaten" ON public.user_exercise_progress FOR UPDATE USING (auth.uid() = user_id);

-- SEED DATEN
-- Beispiel-Videos einfügen
INSERT INTO public.videos (title, description, lesson, is_external, external_url)
VALUES 
('Nicos Weg - Folge 1: Hallo!', 'Lerne Begrüßungen auf Deutsch.', 'A1.1', true, 'https://learngerman.dw.com/de/hallo/l-37250531'),
('Nicos Weg - Folge 2: Wie heißt du?', 'Sich vorstellen und Namen erfragen.', 'A1.1', true, 'https://learngerman.dw.com/de/wie-heißt-du/l-37250532');

INSERT INTO public.videos (title, description, lesson, video_url)
VALUES
('Aussprache: Umlaute (In Vorbereitung)', 'So sprichst du Ä, Ö und Ü richtig aus.', 'A1.1', NULL);

-- Beispiel-Übungen einfügen (Kontrastiv)
INSERT INTO public.exercises (lesson, topic, type, content, hint_ru, hint_tr)
VALUES 
(
  'A1.1', 
  'Artikel', 
  'multiple_choice', 
  '{"question": "Welcher Artikel passt zu ''Mädchen''?", "options": ["der", "die", "das"], "correct_answer": "das"}'::jsonb, 
  'Im Deutschen ist "Mädchen" sächlich (das), da es ein Diminutiv (-chen) ist, unabhängig vom natürlichen Geschlecht.', 
  'Im Deutschen haben Nomen ein grammatisches Geschlecht (der/die/das). Wörter auf "-chen" sind immer neutral (das).'
),
(
  'A1.1', 
  'Verbkonjugation (sein)', 
  'fill_in_blank', 
  '{"text_before": "Ich ", "text_after": " Nico.", "correct_answer": "bin"}'::jsonb, 
  'Im Gegensatz zum Russischen (wo das Verb "sein" im Präsens oft weggelassen wird), muss im Deutschen immer ein Verb stehen: "Ich BIN Nico."', 
  'Achte auf die Endung. Das Hilfsverb "sein" ist unregelmäßig.'
);
