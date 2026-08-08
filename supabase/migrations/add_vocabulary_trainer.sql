-- 1. Tabelle für Vokabelkarten
CREATE TABLE IF NOT EXISTS public.vocabulary_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  word_de text NOT NULL,
  article text CHECK (article IN ('der', 'die', 'das', 'none')),
  plural text,
  translation_ru text,
  translation_tr text,
  translation_en text,
  image_url text,
  audio_url text,
  is_hard_for_ru boolean DEFAULT false,
  is_hard_for_tr boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Tabelle für Lernfortschritt der User
CREATE TABLE IF NOT EXISTS public.user_vocabulary_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.vocabulary_cards(id) ON DELETE CASCADE,
  box_number integer DEFAULT 1 CHECK (box_number BETWEEN 1 AND 7),
  next_review_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- 3. RLS für Vokabelkarten (jeder darf lesen)
ALTER TABLE public.vocabulary_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jeder darf Vokabelkarten lesen"
ON public.vocabulary_cards
FOR SELECT
USING (true);

-- 4. RLS für Lernfortschritt (nur eigener Fortschritt)
ALTER TABLE public.user_vocabulary_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutzer sehen eigenen Lernfortschritt"
ON public.user_vocabulary_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Nutzer können eigenen Lernfortschritt einfügen"
ON public.user_vocabulary_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Nutzer können eigenen Lernfortschritt aktualisieren"
ON public.user_vocabulary_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Nutzer können eigenen Lernfortschritt löschen"
ON public.user_vocabulary_progress
FOR DELETE
USING (auth.uid() = user_id);

-- 5. Beispieldaten einfügen (Seeding für "Schritte plus neu A1.1 - Lektion 1")
INSERT INTO public.vocabulary_cards 
(lesson, word_de, article, translation_ru, translation_tr, is_hard_for_ru, is_hard_for_tr)
VALUES
('Schritte plus neu A1.1 - Lektion 1', 'Apfel', 'der', 'яблоко', 'elma', false, false),
('Schritte plus neu A1.1 - Lektion 1', 'Frau', 'die', 'женщина', 'kadın', false, false),
('Schritte plus neu A1.1 - Lektion 1', 'Buch', 'das', 'книга', 'kitap', true, false), -- Beispiel für Kontrastiv: Artikel "das" oft schwer für Russisch (da "книга" weiblich ist)
('Schritte plus neu A1.1 - Lektion 1', 'lesen', 'none', 'читать', 'okumak', false, true); -- Beispiel für Kontrastiv
