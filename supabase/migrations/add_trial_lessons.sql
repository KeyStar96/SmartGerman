-- Migration: Add trial_lessons table
-- Purpose: Track trial lesson (Probestunde) requests. One free trial per email address.
-- Admin sets status to 'confirmed' or 'cancelled' → cron triggers email.

create table public.trial_lessons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Contact info
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,

  -- Course + chosen trial day
  course_id text not null references public.courses(id) on delete restrict,
  trial_date date not null,

  -- Status workflow: pending → confirmed / cancelled (set by admin)
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),

  -- Email tracking flags
  confirmation_mail_sent boolean default false,
  cancellation_mail_sent boolean default false
);

-- Enforce: one trial per email across the entire school
create unique index trial_lessons_email_unique on public.trial_lessons (lower(email));

-- Enable Row Level Security
alter table public.trial_lessons enable row level security;

-- Anyone can insert (public form submission)
create policy "Anyone can insert trial_lessons"
  on public.trial_lessons for insert
  with check (true);

-- Only service_role can read (admin dashboard / edge functions)
create policy "trial_lessons viewable by service_role"
  on public.trial_lessons for select
  to service_role
  using (true);

-- Allow service_role to update (for email flags and status changes)
create policy "trial_lessons updatable by service_role"
  on public.trial_lessons for update
  to service_role
  using (true);
