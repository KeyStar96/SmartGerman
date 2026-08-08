-- Tabelle für Benutzerprofile erstellen
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text NOT NULL,
  native_language text CHECK (native_language IN ('Russisch', 'Türkisch', 'Andere')),
  subscription_status text DEFAULT 'kostenlos' CHECK (subscription_status IN ('kostenlos', 'aktiv')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security) für die Tabelle aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer dürfen nur ihr eigenes Profil lesen
CREATE POLICY "Benutzer können eigenes Profil sehen" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy: Benutzer dürfen nur ihr eigenes Profil aktualisieren
CREATE POLICY "Benutzer können eigenes Profil aktualisieren" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Funktion: Wird nach einer neuen Registrierung ausgeführt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, native_language)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'native_language'
  );
  RETURN new;
END;
$$;

-- Trigger: Bindet die obige Funktion an das INSERT-Event von auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
