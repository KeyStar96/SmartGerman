-- Fix/Re-Assert: Storage-Bucket + RLS-Policies für Audio-Uploads (Schüler & Lehrkraft)
--
-- Hintergrund: Der Bucket-Name im Code (`lib/audio/upload.ts` → AUDIO_BUCKET)
-- ist 'audio_submissions' (Unterstrich). Dieses Skript ist idempotent und
-- kann jederzeit erneut ausgeführt werden, ohne bestehende Daten zu
-- gefährden – nützlich, falls der Bucket oder die Policies am Live-Projekt
-- fehlen, gelöscht oder versehentlich mit falschem Namen angelegt wurden.

-- 1. Bucket sicherstellen (öffentlich lesbar, da Aufnahmen per öffentlicher
--    URL im Player und im Lehrer-Dashboard eingebettet werden).
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_submissions', 'audio_submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Alte/abweichende Policies für diesen Bucket entfernen, damit dieses
--    Skript ohne Duplicate-Policy-Fehler wiederholt ausführbar ist.
DROP POLICY IF EXISTS "Authentifizierte Nutzer können Audio hochladen" ON storage.objects;
DROP POLICY IF EXISTS "Jeder darf Audio abrufen" ON storage.objects;
DROP POLICY IF EXISTS "Authentifizierte Nutzer können Audio aktualisieren" ON storage.objects;

-- 3. INSERT: Jeder angemeldete Nutzer (Schüler beim Einreichen, Lehrkraft
--    beim Feedback) darf Audio-Dateien in genau diesen Bucket hochladen.
CREATE POLICY "Authentifizierte Nutzer können Audio hochladen"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio_submissions');

-- 4. UPDATE: Wird für `upsert: true` beim erneuten Hochladen unter demselben
--    Pfad benötigt (Client sendet `upsert: true`, siehe `lib/audio/upload.ts`).
--    Ohne diese Policy schlägt ein Upsert-Treffer mit RLS-Fehler fehl.
CREATE POLICY "Authentifizierte Nutzer können Audio aktualisieren"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audio_submissions')
WITH CHECK (bucket_id = 'audio_submissions');

-- 5. SELECT: Wiedergabe der Aufnahmen über die öffentliche URL (Bucket ist
--    public = true, Policy dient als zusätzliche Absicherung auf DB-Ebene).
CREATE POLICY "Jeder darf Audio abrufen"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio_submissions');
