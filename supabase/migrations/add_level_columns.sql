-- Füge die Spalte 'level' zu den Inhalts-Tabellen hinzu

ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'A1.1' 
CHECK (level IN ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'));

ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'A1.1' 
CHECK (level IN ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'));

ALTER TABLE public.vocabulary_cards 
ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'A1.1' 
CHECK (level IN ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'));

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'A1.1' 
CHECK (level IN ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'));
