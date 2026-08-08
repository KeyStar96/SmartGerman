-- 1. Rolle zur profiles Tabelle hinzufügen
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'student' CHECK (role IN ('student', 'teacher'));

-- 2. Tabelle für Schüler-Einreichungen (Submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('audio', 'text')),
  content_url text, -- Storage Path für Audio
  text_content text, -- Für Freitext
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Tabelle für Lehrer-Feedback
CREATE TABLE IF NOT EXISTS public.teacher_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  feedback_audio_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS für Submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
-- Schüler sehen nur ihre eigenen, Lehrer sehen alle
CREATE POLICY "Studenten sehen eigene Submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Lehrer sehen alle Submissions" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
-- Schüler dürfen einreichen
CREATE POLICY "Studenten können Submissions erstellen" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Lehrer dürfen Status updaten
CREATE POLICY "Lehrer können Submissions updaten" ON public.submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- RLS für Teacher Feedback
ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;
-- Schüler sehen Feedback zu ihren Submissions
CREATE POLICY "Studenten sehen ihr Feedback" ON public.teacher_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
);
-- Lehrer sehen alles und können erstellen
CREATE POLICY "Lehrer sehen alle Feedbacks" ON public.teacher_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Lehrer können Feedback erstellen" ON public.teacher_feedback FOR INSERT WITH CHECK (
  auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- 4. Storage Bucket für Audio anlegen
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio_submissions', 'audio_submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Jeder angemeldete Nutzer (Schüler/Lehrer) darf Audio-Dateien in den Bucket hochladen
CREATE POLICY "Authentifizierte Nutzer können Audio hochladen"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'audio_submissions'
);

-- Jeder darf die Audios abrufen (da Public = true, aber wir setzen es auch hier zur Sicherheit)
CREATE POLICY "Jeder darf Audio abrufen"
ON storage.objects FOR SELECT USING (
  bucket_id = 'audio_submissions'
);
