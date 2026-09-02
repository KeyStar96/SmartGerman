-- SmartGerman v2 – Supabase Schema Reference
-- Projekt-ID: wcaslabeiwtvygxtzcio
-- Stand: synchronisiert mit Live-Datenbank (2026-09-02)
--
-- WARNING: Dieses Schema dient als Referenz und Kontext für Agenten.
-- Es ist nicht als vollständiges Setup-Skript gedacht. Tabellenreihenfolge
-- und Abhängigkeiten sind für manuelle Ausführung nicht garantiert.

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE public.courses (
  id text NOT NULL,
  translation_key text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['presence'::text, 'online'::text])),
  price numeric NOT NULL,
  instructor text NOT NULL,
  unit_duration integer NOT NULL,
  sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  title text,
  start_date date,
  end_date date,
  trial_lessons boolean DEFAULT true,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date text NOT NULL,
  email text NOT NULL,
  phone text,
  street text,
  zip text,
  city text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rejected'::text, 'cancelled'::text])),
  privacy_accepted boolean NOT NULL DEFAULT false,
  start_date date,
  total_price numeric,
  agb_accepted boolean NOT NULL DEFAULT false,
  revocation_waiver_accepted boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL,
  video_recording_accepted boolean,
  course_ids text[] DEFAULT '{}'::text[],
  confirmation_mail_sent boolean DEFAULT false,
  course_prices jsonb DEFAULT '{}'::jsonb,
  cancellation_mail_sent boolean DEFAULT false,
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.enrollments (
  registration_id uuid NOT NULL,
  course_id text NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  price numeric,
  CONSTRAINT enrollments_pkey PRIMARY KEY (registration_id, course_id),
  CONSTRAINT enrollments_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.registrations(id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);

CREATE TABLE public.course_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  reason text NOT NULL,
  course_ids text[],
  CONSTRAINT course_exceptions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.cancellations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  course_name text,
  termination_date date,
  termination_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  confirmation_mail_sent boolean DEFAULT false,
  CONSTRAINT cancellations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.trial_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  course_id text,
  trial_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text])),
  confirmation_mail_sent boolean DEFAULT false,
  cancellation_mail_sent boolean DEFAULT false,
  birth_date text,
  street text,
  zip text,
  city text,
  video_recording_accepted boolean,
  CONSTRAINT trial_lessons_pkey PRIMARY KEY (id),
  CONSTRAINT trial_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  email text NOT NULL,
  native_language text CHECK (native_language = ANY (ARRAY['Russisch'::text, 'Türkisch'::text, 'Andere'::text])),
  subscription_status text DEFAULT 'kostenlos'::text CHECK (subscription_status = ANY (ARRAY['kostenlos'::text, 'aktiv'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.vocabulary_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  word_de text NOT NULL,
  article text CHECK (article = ANY (ARRAY['der'::text, 'die'::text, 'das'::text, 'none'::text])),
  plural text,
  translation_ru text,
  translation_tr text,
  translation_en text,
  image_url text,
  audio_url text,
  is_hard_for_ru boolean DEFAULT false,
  is_hard_for_tr boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  level text NOT NULL DEFAULT 'A1.1'::text CHECK (level = ANY (ARRAY['A1.1'::text, 'A1.2'::text, 'A2.1'::text, 'A2.2'::text, 'B1.1'::text, 'B1.2'::text])),
  CONSTRAINT vocabulary_cards_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_vocabulary_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL,
  -- Phase-6-Leitner: 1–6 = aktive Lernphasen, 7 = dauerhaft gelernt
  box_number integer DEFAULT 1 CHECK (box_number >= 1 AND box_number <= 7),
  next_review_date timestamp with time zone DEFAULT now(),
  -- Anzahl der Rückstufungen um eine Phase (falsche Antworten)
  lapses integer NOT NULL DEFAULT 0,
  last_answered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_vocabulary_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_vocabulary_progress_user_id_card_id_key UNIQUE (user_id, card_id),
  CONSTRAINT user_vocabulary_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_vocabulary_progress_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.vocabulary_cards(id)
);

CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  lesson text NOT NULL,
  video_url text,
  external_url text,
  is_external boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  level text NOT NULL DEFAULT 'A1.1'::text CHECK (level = ANY (ARRAY['A1.1'::text, 'A1.2'::text, 'A2.1'::text, 'A2.2'::text, 'B1.1'::text, 'B1.2'::text])),
  CONSTRAINT videos_pkey PRIMARY KEY (id)
);

CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  topic text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['fill_in_blank'::text, 'multiple_choice'::text, 'sentence_building'::text])),
  content jsonb NOT NULL,
  hint_ru text,
  hint_tr text,
  created_at timestamp with time zone DEFAULT now(),
  level text NOT NULL DEFAULT 'A1.1'::text CHECK (level = ANY (ARRAY['A1.1'::text, 'A1.2'::text, 'A2.1'::text, 'A2.2'::text, 'B1.1'::text, 'B1.2'::text])),
  -- Optionale MP3-URL für den Tap-to-Listen-Button der Lösung.
  solution_audio_url text,
  CONSTRAINT exercises_pkey PRIMARY KEY (id)
);

-- content-JSONB je Übungstyp:
--   fill_in_blank    { text_before, text_after, correct_answer, options?: string[], smart_hint?: string }
--   multiple_choice  { question, options: string[], correct_answer }
--   sentence_building{ parts: string[] }
-- `options` sind die Auswahl-Chips. Fehlt der Key, generiert die Anwendung sie
-- aus der passenden Wortfamilie (siehe lib/exercise-chips.ts).

CREATE TABLE public.user_exercise_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  completed boolean DEFAULT false,
  score integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Anzahl der Antwortversuche; ab 2 Fehlversuchen erscheint ein Smart Hint.
  attempts integer NOT NULL DEFAULT 0,
  hint_shown boolean NOT NULL DEFAULT false,
  CONSTRAINT user_exercise_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_exercise_progress_user_id_exercise_id_key UNIQUE (user_id, exercise_id),
  CONSTRAINT user_exercise_progress_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT user_exercise_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_exercise_progress_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);

CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['audio'::text, 'text'::text])),
  content_url text,
  text_content text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  parent_id uuid,
  attempt_number integer DEFAULT 1,
  level text NOT NULL DEFAULT 'A1.1'::text CHECK (level = ANY (ARRAY['A1.1'::text, 'A1.2'::text, 'A2.1'::text, 'A2.2'::text, 'B1.1'::text, 'B1.2'::text])),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT submissions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.submissions(id)
);

CREATE TABLE public.teacher_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  feedback_text text NOT NULL,
  feedback_audio_url text,
  created_at timestamp with time zone DEFAULT now(),
  -- NULL = der Schüler hat das Feedback noch nicht geöffnet (Dashboard-Hinweis)
  seen_at timestamp with time zone,
  CONSTRAINT teacher_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_feedback_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id),
  CONSTRAINT teacher_feedback_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);

-- =============================================================================
-- INDEXES (zusätzlich zu Primary Keys)
-- =============================================================================

CREATE INDEX idx_cancellations_mail_sent ON public.cancellations USING btree (confirmation_mail_sent);
CREATE INDEX idx_exercises_level_lesson ON public.exercises USING btree (level, lesson);
CREATE INDEX idx_user_exercise_progress_user_completed ON public.user_exercise_progress USING btree (user_id, completed);
CREATE INDEX idx_user_vocabulary_progress_due ON public.user_vocabulary_progress USING btree (user_id, next_review_date, box_number);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles USING btree (stripe_customer_id);
CREATE INDEX idx_profiles_stripe_subscription_id ON public.profiles USING btree (stripe_subscription_id);
CREATE INDEX submissions_parent_id_idx ON public.submissions USING btree (parent_id);
CREATE INDEX idx_submissions_user_level_created ON public.submissions USING btree (user_id, level, created_at DESC);
CREATE INDEX idx_teacher_feedback_unseen ON public.teacher_feedback USING btree (submission_id) WHERE seen_at IS NULL;
CREATE UNIQUE INDEX trial_lessons_person_unique ON public.trial_lessons USING btree (lower(email), lower(first_name), lower(last_name));

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, native_language)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'native_language'
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_registration_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  cid text;
  c_price numeric;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    IF NEW.course_ids IS NOT NULL THEN
      FOREACH cid IN ARRAY NEW.course_ids
      LOOP
        BEGIN
          c_price := (NEW.course_prices ->> cid)::numeric;
        EXCEPTION WHEN OTHERS THEN
          c_price := 0;
        END;

        INSERT INTO public.enrollments (registration_id, course_id, assigned_at, price)
        VALUES (NEW.id, cid, now(), c_price)
        ON CONFLICT (registration_id, course_id)
        DO UPDATE SET price = EXCLUDED.price;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Markiert das Feedback einer eigenen Einreichung als gelesen.
-- SECURITY DEFINER, weil der Schüler bewusst keine UPDATE-Policy auf
-- teacher_feedback erhält: so bleibt der Feedback-Text für ihn unveränderlich.
CREATE OR REPLACE FUNCTION public.mark_feedback_seen(p_submission_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.mark_feedback_seen(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_feedback_seen(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_feedback_seen(uuid) TO authenticated;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_registration_confirmed
  AFTER UPDATE OF status ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION handle_registration_confirmation();

-- Edge Function: notify-new-enrollment (Service-Role-Key nicht im Repo speichern)
CREATE TRIGGER "notify-registration-insert"
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
    'https://wcaslabeiwtvygxtzcio.supabase.co/functions/v1/notify-new-enrollment',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer <SUPABASE_SERVICE_ROLE_KEY>"}',
    '{}',
    '5000'
  );

CREATE TRIGGER "notify-trial-insert"
  AFTER INSERT ON public.trial_lessons
  FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
    'https://wcaslabeiwtvygxtzcio.supabase.co/functions/v1/notify-new-enrollment',
    'POST',
    '{"Content-type":"application/json","Authorization":"Bearer <SUPABASE_SERVICE_ROLE_KEY>"}',
    '{}',
    '5000'
  );

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_cards ENABLE ROW LEVEL SECURITY;

-- cancellations
CREATE POLICY "Enable insert for everyone" ON public.cancellations FOR INSERT TO public WITH CHECK (true);

-- course_exceptions
CREATE POLICY "Public read access" ON public.course_exceptions FOR SELECT TO public USING (true);
CREATE POLICY "Admin write access" ON public.course_exceptions FOR INSERT TO public WITH CHECK (true);

-- courses
CREATE POLICY "Courses are publicly viewable" ON public.courses FOR SELECT TO public USING (true);

-- enrollments
CREATE POLICY "Anyone can insert enrollments" ON public.enrollments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enrollments viewable by service_role only" ON public.enrollments FOR SELECT TO service_role USING (true);
CREATE POLICY "Service Role Full Access Enrollments" ON public.enrollments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- exercises
CREATE POLICY "Nutzer können Übungen sehen" ON public.exercises FOR SELECT TO public USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins und Lehrer dürfen Übungen einfügen" ON public.exercises FOR INSERT TO public WITH CHECK ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
CREATE POLICY "Admins und Lehrer dürfen Übungen bearbeiten" ON public.exercises FOR UPDATE TO public USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
CREATE POLICY "Admins und Lehrer dürfen Übungen löschen" ON public.exercises FOR DELETE TO public USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));

-- profiles
CREATE POLICY "Benutzer können eigenes Profil sehen" ON public.profiles FOR SELECT TO public USING (auth.uid() = id);
CREATE POLICY "Benutzer können eigenes Profil aktualisieren" ON public.profiles FOR UPDATE TO public USING (auth.uid() = id);
CREATE POLICY "Admins und Lehrer können Profile updaten" ON public.profiles FOR UPDATE TO public USING ((SELECT profiles_1.role FROM profiles profiles_1 WHERE profiles_1.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));

-- registrations
CREATE POLICY "Anyone can insert registration" ON public.registrations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Registrations viewable by service_role only" ON public.registrations FOR SELECT TO service_role USING (true);
CREATE POLICY "Service Role Full Access Registrations" ON public.registrations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- submissions
CREATE POLICY "Studenten können Submissions erstellen" ON public.submissions FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Studenten sehen eigene Submissions" ON public.submissions FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Lehrer sehen alle Submissions" ON public.submissions FOR SELECT TO public USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'::text));
CREATE POLICY "Lehrer können Submissions updaten" ON public.submissions FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'::text));

-- teacher_feedback
CREATE POLICY "Lehrer können Feedback erstellen" ON public.teacher_feedback FOR INSERT TO public WITH CHECK (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'::text));
CREATE POLICY "Lehrer sehen alle Feedbacks" ON public.teacher_feedback FOR SELECT TO public USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'::text));
CREATE POLICY "Studenten sehen ihr Feedback" ON public.teacher_feedback FOR SELECT TO public USING (EXISTS (SELECT 1 FROM submissions WHERE submissions.id = teacher_feedback.submission_id AND submissions.user_id = auth.uid()));

-- trial_lessons
CREATE POLICY "Anyone can insert trial_lessons" ON public.trial_lessons FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "trial_lessons viewable by service_role" ON public.trial_lessons FOR SELECT TO service_role USING (true);
CREATE POLICY "trial_lessons updatable by service_role" ON public.trial_lessons FOR UPDATE TO service_role USING (true);

-- user_exercise_progress
CREATE POLICY "Nutzer können eigenen Übungsfortschritt anlegen" ON public.user_exercise_progress FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutzer sehen eigenen Übungsfortschritt" ON public.user_exercise_progress FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Nutzer können eigenen Übungsfortschritt updaten" ON public.user_exercise_progress FOR UPDATE TO public USING (auth.uid() = user_id);

-- user_vocabulary_progress
CREATE POLICY "Nutzer können eigenen Lernfortschritt einfügen" ON public.user_vocabulary_progress FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutzer sehen eigenen Lernfortschritt" ON public.user_vocabulary_progress FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Nutzer können eigenen Lernfortschritt aktualisieren" ON public.user_vocabulary_progress FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Nutzer können eigenen Lernfortschritt löschen" ON public.user_vocabulary_progress FOR DELETE TO public USING (auth.uid() = user_id);

-- users
CREATE POLICY "Users viewable by service_role only" ON public.users FOR SELECT TO service_role USING (true);
CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- videos
CREATE POLICY "Nutzer können Videos sehen" ON public.videos FOR SELECT TO public USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins und Lehrer dürfen Videos einfügen" ON public.videos FOR INSERT TO public WITH CHECK ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
CREATE POLICY "Admins und Lehrer dürfen Videos bearbeiten" ON public.videos FOR UPDATE TO public USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
CREATE POLICY "Admins und Lehrer dürfen Videos löschen" ON public.videos FOR DELETE TO public USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));

-- vocabulary_cards
CREATE POLICY "Jeder darf Vokabelkarten lesen" ON public.vocabulary_cards FOR SELECT TO public USING (true);
CREATE POLICY "Admins und Lehrer dürfen Vokabelkarten einfügen" ON public.vocabulary_cards FOR INSERT TO public WITH CHECK ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
CREATE POLICY "Admins und Lehrer dürfen Vokabelkarten bearbeiten" ON public.vocabulary_cards FOR UPDATE TO public USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
CREATE POLICY "Admins und Lehrer dürfen Vokabelkarten löschen" ON public.vocabulary_cards FOR DELETE TO public USING ((SELECT profiles.role FROM profiles WHERE profiles.id = auth.uid()) = ANY (ARRAY['admin'::text, 'teacher'::text]));
