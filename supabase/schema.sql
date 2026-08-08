-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.courses (
  start_date date,
  end_date date,
  trial_lessons boolean DEFAULT true,
  id text NOT NULL,
  translation_key text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['presence'::text, 'online'::text])),
  price numeric NOT NULL,
  instructor text NOT NULL,
  unit_duration integer NOT NULL,
  sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  title text,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
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
  course_ids ARRAY DEFAULT '{}'::text[],
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
  date date NOT NULL,
  reason text NOT NULL,
  course_ids ARRAY,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT course_exceptions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date text NOT NULL,
  email text NOT NULL,
  phone text,
  street text,
  zip text,
  city text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cancellations (
  full_name text NOT NULL,
  email text NOT NULL,
  course_name text,
  termination_date date,
  termination_type text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  confirmation_mail_sent boolean DEFAULT false,
  CONSTRAINT cancellations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.trial_lessons (
  video_recording_accepted boolean,
  course_id text,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  trial_date date NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text])),
  confirmation_mail_sent boolean DEFAULT false,
  cancellation_mail_sent boolean DEFAULT false,
  birth_date text,
  street text,
  zip text,
  city text,
  CONSTRAINT trial_lessons_pkey PRIMARY KEY (id),
  CONSTRAINT trial_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text NOT NULL,
  native_language text CHECK (native_language IN ('Russisch', 'Türkisch', 'Andere')),
  subscription_status text DEFAULT 'kostenlos' CHECK (subscription_status IN ('kostenlos', 'aktiv')),
  stripe_customer_id text,
  stripe_subscription_id text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
-- Note: RLS and Triggers for auth.users to automatically populate public.profiles are applied via migrations.

CREATE TABLE public.vocabulary_cards (
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

CREATE TABLE public.user_vocabulary_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.vocabulary_cards(id) ON DELETE CASCADE,
  box_number integer DEFAULT 1 CHECK (box_number BETWEEN 1 AND 7),
  next_review_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, card_id)
);

CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  lesson text NOT NULL,
  video_url text,
  is_external boolean DEFAULT false,
  external_url text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson text NOT NULL,
  topic text NOT NULL,
  type text NOT NULL CHECK (type IN ('fill_in_blank', 'multiple_choice', 'sentence_building')),
  content jsonb NOT NULL,
  hint_ru text,
  hint_tr text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.user_exercise_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  score integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('audio', 'text')),
  content_url text,
  text_content text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.teacher_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  feedback_audio_url text,
  created_at timestamp with time zone DEFAULT now()
);