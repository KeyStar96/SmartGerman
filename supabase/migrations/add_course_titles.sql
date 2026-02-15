-- Add title column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title text;

-- Update existing courses with titles from de.json
UPDATE public.courses SET title = CASE translation_key
    WHEN 'de50_a1_1' THEN 'Deutsch 50+ A1.1'
    WHEN 'de50_a1_2' THEN 'Deutsch 50+ A1.2'
    WHEN 'de50_a2' THEN 'Deutsch 50+ A2'
    WHEN 'speech_a1_1' THEN 'Sprechtraining A1.1'
    WHEN 'speech_a1_2' THEN 'Sprechtraining A1.2'
    WHEN 'speech_a2' THEN 'Sprechtraining A2'
    WHEN 'online_a1_1' THEN 'Grundlagen A1.1 (Online)'
    WHEN 'online_b1' THEN 'Deutsch B1 (Online)'
    WHEN 'online_b2' THEN 'Deutsch B2 (Online)'
    ELSE title -- Keep existing if no match
END;
