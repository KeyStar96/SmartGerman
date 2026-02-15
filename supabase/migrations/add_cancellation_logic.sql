-- 1. Modify the 'status' check constraint to include 'cancelled'
-- Postgres doesn't allow directly altering a check constraint easily. 
-- We drop the old one and add a new one.
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;

ALTER TABLE public.registrations
ADD CONSTRAINT registrations_status_check 
CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled'));

-- 2. Add 'cancellation_mail_sent' column
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS cancellation_mail_sent boolean DEFAULT false;

-- 3. (Optional) Enable Cronjob for cancellation emails
-- Replace PROJECT_REF and SERVICE_ROLE_KEY with your actual values.
/*
SELECT cron.schedule(
  'send-cancellation-emails', -- name of the cron job
  '0 9 * * *',                -- every day at 09:00 AM (or strictly: '*/30 * * * *' for every 30 mins)
  $$
  SELECT
    net.http_post(
        url:='https://PROJECT_REF.supabase.co/functions/v1/send-cancellation-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
*/
