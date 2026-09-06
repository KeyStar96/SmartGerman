-- Migration: add_ui_language_and_expand_native_language
-- Angewendet am 2026-09-06 (Live-Projekt wcaslabeiwtvygxtzcio) via Supabase MCP.
--
-- Ziel: Erstsprache-basiertes Onboarding + persistente, manuell änderbare
-- Oberflächensprache. Additiv & rückwärtskompatibel:
--   * bestehende native_language-Werte ('Russisch','Türkisch') bleiben gültig,
--   * neue Spalte ui_language hat sicheren Default 'de',
--   * der Signup-Trigger leitet ui_language aus der Erstsprache ab.

-- 1. native_language: erlaubte Werte auf die fünf Erstsprachen erweitern (+ Legacy 'Andere').
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_native_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_native_language_check
  CHECK (native_language = ANY (ARRAY['Deutsch'::text, 'Englisch'::text, 'Russisch'::text, 'Türkisch'::text, 'Ukrainisch'::text, 'Andere'::text]));

-- 2. ui_language: persistente Oberflächensprache als Locale-Code, sicherer Default 'de'.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_language text NOT NULL DEFAULT 'de'
  CHECK (ui_language = ANY (ARRAY['de'::text, 'en'::text, 'uk'::text, 'ru'::text, 'tr'::text]));

-- 3. Bestehende Nutzer: UI-Sprache aus der Erstsprache ableiten (Backfill).
UPDATE public.profiles
SET ui_language = CASE native_language
  WHEN 'Russisch' THEN 'ru'
  WHEN 'Türkisch' THEN 'tr'
  WHEN 'Ukrainisch' THEN 'uk'
  WHEN 'Englisch' THEN 'en'
  WHEN 'Deutsch' THEN 'de'
  ELSE 'de'
END;

-- 4. Trigger: neue Registrierungen setzen ui_language passend zur Erstsprache.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_native text := new.raw_user_meta_data->>'native_language';
BEGIN
  INSERT INTO public.profiles (id, email, name, native_language, ui_language)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    v_native,
    CASE v_native
      WHEN 'Russisch' THEN 'ru'
      WHEN 'Türkisch' THEN 'tr'
      WHEN 'Ukrainisch' THEN 'uk'
      WHEN 'Englisch' THEN 'en'
      WHEN 'Deutsch' THEN 'de'
      ELSE 'de'
    END
  );
  RETURN new;
END;
$function$;
