-- Migration: Update trial_lessons table
-- Add personal data fields (same as regular registration)
-- Change unique constraint to first_name + last_name + email combo

-- 1. Add missing personal data columns
ALTER TABLE public.trial_lessons
ADD COLUMN IF NOT EXISTS birth_date text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS city text;

-- 2. Drop old email-only unique index
DROP INDEX IF EXISTS trial_lessons_email_unique;

-- 3. Create new unique index on name + email combo
CREATE UNIQUE INDEX trial_lessons_person_unique
  ON public.trial_lessons (lower(email), lower(first_name), lower(last_name));
