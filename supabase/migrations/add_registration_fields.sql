-- Add start_date and total_price to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS total_price numeric;

-- Comment: start_date will store the first day of the selected course month (e.g. 2026-03-01)
-- Comment: total_price stores the calculated monthly total at the time of booking
