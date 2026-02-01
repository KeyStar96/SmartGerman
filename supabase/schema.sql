-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. COURSES Table
create table public.courses (
  id text primary key, -- Speakable ID like 'c_a1_50plus'
  translation_key text not null,
  type text not null check (type in ('presence', 'online')),
  price numeric not null,
  sessions jsonb not null default '[]'::jsonb, -- Array of objects: [{day: "Mo", ...}]
  instructor text not null,
  unit_duration integer not null, -- Duration in minutes
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.courses enable row level security;

-- Policies for courses (Public read-only)
create policy "Courses are publicly viewable"
  on public.courses for select
  using ( true );


-- 2. REGISTRATIONS Table
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  
  -- Flat columns for easy copy-paste
  salutation text,
  title text, -- Nullable
  first_name text not null,
  last_name text not null,
  birth_date text not null, -- DD.MM.YYYY
  email text not null,
  phone text,
  
  street text not null,
  zip text not null,
  city text not null,
  
  privacy_accepted boolean not null default false
);

-- Enable RLS
alter table public.registrations enable row level security;

-- Policies for registrations 
-- (Allow insert for public/anon users who are registering)
create policy "Anyone can insert registration"
  on public.registrations for insert
  with check ( true );

-- (Allow selects only for authenticated service_role or admin - adjustment needed based on auth setup)
-- For now, we restrict read access to service_role mostly, or implementing user specific logic later.
-- This simple policy ensures data isn't publicly exposed.
create policy "Registrations viewable by service_role only"
  on public.registrations for select
  to service_role
  using ( true );


-- 3. ENROLLMENTS Table (Join Table)
create table public.enrollments (
  registration_id uuid not null references public.registrations(id) on delete cascade,
  course_id text not null references public.courses(id) on delete restrict,
  assigned_at timestamptz default now(),
  primary key (registration_id, course_id)
);

-- Enable RLS
alter table public.enrollments enable row level security;

-- Policies for enrollments
create policy "Anyone can insert enrollments"
  on public.enrollments for insert
  with check ( true );
  
create policy "Enrollments viewable by service_role only"
  on public.enrollments for select
  to service_role
  using ( true );
