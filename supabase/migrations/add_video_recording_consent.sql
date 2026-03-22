-- Migration: Add video recording consent column to registrations and trial_lessons tables
-- NULL = not applicable (presence courses), true = consent given (online courses)

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS video_recording_accepted boolean default null;

ALTER TABLE public.trial_lessons
ADD COLUMN IF NOT EXISTS video_recording_accepted boolean default null;

-- Comment: Stores explicit user consent for video/audio recording of online sessions via Microsoft Teams
