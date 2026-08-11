-- Erlaube Administratoren und Lehrkräften das Bearbeiten von Profilen
CREATE POLICY "Admins und Lehrer können Profile updaten"
ON public.profiles
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher')
);

-- Erlaube Administratoren und Lehrkräften vollen Zugriff auf Vokabeln
CREATE POLICY "Admins und Lehrer dürfen Vokabelkarten einfügen"
ON public.vocabulary_cards FOR INSERT 
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Admins und Lehrer dürfen Vokabelkarten bearbeiten"
ON public.vocabulary_cards FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Admins und Lehrer dürfen Vokabelkarten löschen"
ON public.vocabulary_cards FOR DELETE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

-- Erlaube Administratoren und Lehrkräften vollen Zugriff auf Videos
CREATE POLICY "Admins und Lehrer dürfen Videos einfügen"
ON public.videos FOR INSERT 
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Admins und Lehrer dürfen Videos bearbeiten"
ON public.videos FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Admins und Lehrer dürfen Videos löschen"
ON public.videos FOR DELETE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

-- Erlaube Administratoren und Lehrkräften vollen Zugriff auf Übungen
CREATE POLICY "Admins und Lehrer dürfen Übungen einfügen"
ON public.exercises FOR INSERT 
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Admins und Lehrer dürfen Übungen bearbeiten"
ON public.exercises FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Admins und Lehrer dürfen Übungen löschen"
ON public.exercises FOR DELETE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'teacher'));
