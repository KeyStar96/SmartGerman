-- Add confirmation_mail_sent column to cancellations table
ALTER TABLE public.cancellations 
ADD COLUMN IF NOT EXISTS confirmation_mail_sent boolean DEFAULT false;

-- Add index for performance in queries
CREATE INDEX IF NOT EXISTS idx_cancellations_mail_sent ON public.cancellations(confirmation_mail_sent);
