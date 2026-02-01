-- Migration: Normalize Users and Registrations
-- Goal: Separate user profile data into a 'users' table and link 'registrations' to it.
-- Unique User Identifier: (first_name, last_name, birth_date)

-- 1. Create 'users' table
create table public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  
  -- Unique Identifier fields
  first_name text not null,
  last_name text not null,
  birth_date text not null, -- DD.MM.YYYY

  -- Mutable Contact Info (latest will be used)
  email text not null, -- Intentionally NOT unique constraint to allow corrections if needed, but app logic treats Name+DOB as unique identity
  phone text,
  street text,
  zip text,
  city text
);

-- Enable RLS on users
alter table public.users enable row level security;
create policy "Users viewable by service_role only"
  on public.users for select
  to service_role
  using ( true );

-- 2. Add 'user_id' to registrations (initially nullable)
alter table public.registrations 
add column user_id uuid references public.users(id);

-- 3. Data Migration: Populate 'users' from existing 'registrations'
-- We select DISTINCT users based on Name+DOB.
-- We use DISTINCT ON to pick the LATEST entry (ordered by created_at DESC) for contact info.
insert into public.users (first_name, last_name, birth_date, email, phone, street, zip, city, created_at)
select distinct on (first_name, last_name, birth_date)
  first_name,
  last_name,
  birth_date,
  email,
  phone,
  street,
  zip,
  city,
  created_at
from public.registrations
order by first_name, last_name, birth_date, created_at desc;

-- 4. Data Migration: Link 'registrations' to 'users'
update public.registrations r
set user_id = u.id
from public.users u
where r.first_name = u.first_name
  and r.last_name = u.last_name
  and r.birth_date = u.birth_date;

-- 5. Enforce 'user_id' NOT NULL (Validation)
-- If this fails, some registrations didn't match a user (should be impossible given step 3)
alter table public.registrations 
alter column user_id set not null;

-- 6. Cleanup: Drop redundant columns from 'registrations'
alter table public.registrations
drop column first_name,
drop column last_name,
drop column birth_date,
drop column email,
drop column phone,
drop column street,
drop column zip,
drop column city,
drop column salutation, -- Assumed unused or moving to user if needed (plan didn't specify, dropping as per cleanup)
drop column title;      -- Assumed unused or moving to user if needed

-- 7. Verification Query (Optional run after)
-- select * from registrations join users on registrations.user_id = users.id;
