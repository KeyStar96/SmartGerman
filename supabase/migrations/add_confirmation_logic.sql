-- 1. Add new columns to registrations table
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS course_ids text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS confirmation_mail_sent boolean DEFAULT false;

-- 2. Function to automatically create enrollments when status changes to 'confirmed'
CREATE OR REPLACE FUNCTION public.handle_registration_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  cid text;
BEGIN
  -- Only proceed if status changed to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    
    -- Iterate through the course_ids array
    IF NEW.course_ids IS NOT NULL THEN
      FOREACH cid IN ARRAY NEW.course_ids
      LOOP
        -- Insert into enrollments if not exists
        INSERT INTO public.enrollments (registration_id, course_id, assigned_at)
        VALUES (NEW.id, cid, now())
        ON CONFLICT (registration_id, course_id) DO NOTHING;
      END LOOP;
    END IF;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_registration_confirmed ON public.registrations;
CREATE TRIGGER on_registration_confirmed
  AFTER UPDATE OF status ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_registration_confirmation();

-- 4. Enable Extensions for Cronjob
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 5. (Optional) Schedule the Cronjob
-- Replace PROJECT_REF and SERVICE_ROLE_KEY with your actual values.
/*
SELECT cron.schedule(
  'send-confirmation-emails', -- name of the cron job
  '*/10 * * * *',             -- every 10 minutes
  $$
  SELECT
    net.http_post(
        url:='https://PROJECT_REF.supabase.co/functions/v1/send-confirmation-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
*/
