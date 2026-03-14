-- Insert new "Deutsch A1.1 (Online)" course
INSERT INTO public.courses (id, translation_key, title, type, price, sessions, instructor, unit_duration)
VALUES (
    'c_online_a1_1', 
    'online_a1_1', -- Wichtig als ID-Fallback
    'Deutsch A1.1 (Online)', -- Das ist der neue direkte Titel, der jetzt im Frontend genutzt wird
    'online',
    8.50, -- Start-Preis (beliebig anpassbar im Dashboard)
    '[{"day": "So", "endTime": "11:00", "startTime": "10:00"}, {"day": "Do", "endTime": "10:00", "startTime": "09:00", "isAlternating": true, "altStartTime": "15:00", "altEndTime": "16:00"}]'::jsonb, 
    'standard', -- Trainer (z.B. 'standard' oder anpassen)
    60 -- Dauer in Minuten
)
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title;
