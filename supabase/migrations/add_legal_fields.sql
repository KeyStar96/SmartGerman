-- Add legal consent columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS agb_accepted boolean not null default false,
ADD COLUMN IF NOT EXISTS revocation_waiver_accepted boolean not null default false;

-- Comment: Stores explicit user consent for AGB and Revocation Waiver (Widerrufsrecht)
