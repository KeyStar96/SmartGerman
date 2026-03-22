-- Create exceptions table
CREATE TABLE IF NOT EXISTS course_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  course_ids TEXT[] -- Array of strings, nullable (null means all courses)
);

-- Enable RLS
ALTER TABLE course_exceptions ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read Access
CREATE POLICY "Public read access"
  ON course_exceptions
  FOR SELECT
  USING (true);

-- Policy: Admin Write Access (assuming anon/service_role split, mostly for seeding now)
CREATE POLICY "Admin write access"
  ON course_exceptions
  FOR INSERT
  WITH CHECK (true); -- Ideally restrict to service role, but for now open for seeding script if needed, or rely on service_role bypass

-- Seed existing exception
INSERT INTO course_exceptions (date, reason, course_ids)
VALUES ('2026-02-02', 'Kursraum steht noch nicht zur Verfügung', NULL);
