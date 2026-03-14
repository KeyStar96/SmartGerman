-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
CREATE TABLE public.course_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  reason text NOT NULL,
  course_ids ARRAY,
  CONSTRAINT course_exceptions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.courses (
  id text NOT NULL,
  translation_key text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['presence'::text, 'online'::text])),
  price numeric NOT NULL,
  sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructor text NOT NULL,
  unit_duration integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  title text,
  CONSTRAINT courses_pkey PRIMARY KEY (id)
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
  course_ids ARRAY DEFAULT '{}'::text[],
  confirmation_mail_sent boolean DEFAULT false,
  course_prices jsonb DEFAULT '{}'::jsonb,
  cancellation_mail_sent boolean DEFAULT false,
  video_recording_accepted boolean,
  CONSTRAINT registrations_pkey PRIMARY KEY (id),
  CONSTRAINT registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.trial_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  course_id text NOT NULL,
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