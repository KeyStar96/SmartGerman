-- Fix RLS Permissions for Service Role to ensure INSERT/UPDATE works
-- Run this in Supabase SQL Editor

-- 1. USERS Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Full Access Users" ON public.users;
CREATE POLICY "Service Role Full Access Users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. REGISTRATIONS Table
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Full Access Registrations" ON public.registrations;
CREATE POLICY "Service Role Full Access Registrations"
ON public.registrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. ENROLLMENTS Table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Full Access Enrollments" ON public.enrollments;
CREATE POLICY "Service Role Full Access Enrollments"
ON public.enrollments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
