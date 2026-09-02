# Current State Analysis (Ist-Zustand)

## 1. Übersicht
Das Repository "SmartGerman" ist eine Next.js (App Router) basierte Webanwendung, die als Lernplattform für die "Sitov Language Academy" dient. Der aktuelle Stand bildet die Basis für eine Transition in eine produktionsreife und monetarisierbare Umgebung, optimiert für eine Zielgruppe im besten Alter (Fokus: Geragogik, Barrierefreiheit, klare Strukturen).

## 2. Tech-Stack & Abhängigkeiten
- **Framework:** Next.js 16.1.1 (App Router)
- **Sprache:** TypeScript (strict mode)
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Animationen:** Framer Motion, GSAP, Lenis (Smooth Scrolling)
- **Datenbank & Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Payment:** Stripe (`stripe` 22.4.0)
- **Formulare & Validierung:** React Hook Form, Zod
- **Testing:** Jest, Playwright (E2E), React Testing Library
- **Mailing:** Nodemailer
- **Caching/Rate-Limiting:** Upstash Redis & Ratelimit

## 3. Funktionierende Features
- **Internationalisierung (i18n):** Middleware für Routing über `app/[lang]`. Unterstützte Sprachen: `de`, `en`, `ru`, `uk`, `tr`.
- **Authentifizierung:** Supabase Auth mit Session-Update in der Middleware, Confirm-Route unter `/auth/confirm` (PKCE und Token-Hash), i18n-Auth-Seiten in fünf Sprachen. Bestätigungslinks zeigen auf `https://www.sitov-academy.com`, nicht auf localhost.
- **Vokabeltrainer A1.1:** Live-Inhalt sind die Lernsets **Lektion 1** (84 Karten) und **Lektion 2** (161 Karten), inkl. Begrüßung, Familie, Zahlen und Einkaufen. Das Demo-Set „Schritte plus neu“ ist entfernt. Seed-SQL: `supabase/seeds/a11_lektion_1.sql`, `a11_lektion_2_familie.sql`, `a11_lektion_2_einkauf.sql`.
- **Rollen-Routing & Schutz:** Die Middleware unterscheidet zwischen öffentlichen Pfaden, geschützten Pfaden (`/dashboard`, `/premium`) und Auth-Pfaden (`/login`, `/register`).
- **Teacher/Admin Dashboard (Ansatz):** Ordnerstrukturen für `/admin` existieren, grundlegende Routen sind angelegt.
- **Datenbank-Schema:** Komplexe Tabellenstrukturen existieren bereits (Kurse, Registrierungen, Profile mit Rollen `student/teacher`, Vokabel-Kartenbank, Übungen, Video-Lektionen, Lehrer-Feedback-System).
- **Supabase MCP-Integration:** Cursor-Supabase-Plugin authentifiziert; Schema-Sync via Live-Projekt `wcaslabeiwtvygxtzcio`. `supabase/schema.sql` und `supabase/database.types.ts` sind mit dem Live-Stand synchronisiert (2026-09-02).

## 3a. Übungs-Modul: Lückentexte (abgeschlossen, Schritt 1)
- **Tipp-Chips statt Tastatur:** Das freie `<input>` im Lückentext ist entfernt. Lernende tippen einen von mehreren Auswahl-Chips an (Tap-to-Select, kein Drag-and-Drop, 64px Touch-Targets).
- **Chip-Generierung:** Von der Lehrkraft gepflegte `content.options` haben Vorrang. Fehlen sie, erzeugt `lib/exercise-chips.ts` Distraktoren aus derselben Wortfamilie (sein/haben/Modalverben/Artikel/Pronomen), danach morphologisch, danach aus Lösungen benachbarter Übungen. Die Reihenfolge ist über einen Seed aus der Übungs-ID deterministisch (keine Hydration-Fehler, keine springende UI).
- **Smart Hints:** Ab 2 Fehlversuchen erscheint ein dezenter Hinweis (Genus aus der Vokabelbank bzw. Wortart), ab 3 Fehlversuchen Anfangsbuchstabe und Wortlänge. Stufe 1 verrät die Lösung nie.
- **Zero-Error-UX:** Falsch getippte Chips werden ausgegraut statt als Fehler markiert; die Aufgabe bleibt offen, bis sie gelöst ist. Kein Timer, keine Bestenliste, kein rotes Fehler-Feedback.
- **Native Audio-Wiedergabe:** Nach dem Lösen stehen Tap-Buttons für das Wort und den gesamten Satz bereit. Fallback-Kette: `exercises.solution_audio_url` → `vocabulary_cards.audio_url` → Web-Speech-API → Hinweistext.
- **Strict Typing:** `content: any` ist durch eine diskriminierte Union mit JSONB-Parsern ersetzt (`lib/types/exercise.ts`). Ungültig gepflegte Inhalte werden serverseitig ausgefiltert und geloggt, statt eine leere Karte zu rendern.
- **Route-Vollständigkeit:** `error.tsx` und `loading.tsx` (Skeleton) für `/dashboard/level/[level]/exercises` ergänzt.
- **i18n:** Alle neuen Texte liegen in `dictionaries/{de,en,ru,uk,tr}.json` unter `exercises`; Platzhalter wie `{letter}` werden über `lib/exercise-i18n.ts` interpoliert.
- **CMS:** Lehrkräfte pflegen jetzt Auswahl-Chips, einen eigenen Smart Hint und eine Audio-URL pro Übung.
- **DB-Migration:** `supabase/migrations/add_fill_in_blank_chips.sql` (additiv: `user_exercise_progress.attempts`, `.hint_shown`, `exercises.solution_audio_url`, Score-CHECK, zwei Indizes). **Noch nicht am Live-Projekt ausgeführt** – bis dahin schlagen Chip-Übungen zur Laufzeit fehl.

## 3b. Vokabel-Modul: Phase-6-Leitner (abgeschlossen, Schritt 2)
- **Phasenmodell:** `lib/leitner.ts` kapselt das Modell als reine, testbare Funktionen. Sechs aktive Phasen mit den Ruhezeiten Tag 1, 1, 3, 9, 29, 90; `box_number = 7` ist der terminale Zustand „gelernt" und wird nicht mehr abgefragt. Der bestehende CHECK (1..7) bleibt damit unverändert gültig.
- **Fehler-Regel:** Eine falsche Antwort setzt die Vokabel **exakt eine Phase** zurück (Minimum Phase 1). Es wird nichts zurückgesetzt oder gelöscht; eine bereits gelernte Karte landet zurück in Phase 5. Ein Zähler `lapses` protokolliert jede Rückstufung.
- **Kontrastive Anpassung:** Für Vokabeln, die für die Muttersprache des Lernenden als schwer markiert sind (`is_hard_for_ru` / `is_hard_for_tr`), wird die Ruhezeit halbiert (mindestens 1 Tag). Die Muttersprache wird serverseitig aus dem Profil gelesen, nie vom Client übernommen.
- **Server Actions:** `app/actions/vocabulary.ts` ist vollständig typisiert (`lib/types/vocabulary.ts`), `any` ist entfernt. `submitVocabularyAnswer` schreibt Phase, Termin, `lapses` und `last_answered_at` in einem Aufwasch; die Revalidierung passiert erst in `finishVocabularySession`, damit die laufende Session nicht neu lädt.
- **Bugfix `initializeLesson`:** Die Funktion filterte nur nach Lektionsnamen und legte dadurch Karten fremder Sprachniveaus an. Sie filtert jetzt zusätzlich nach `level`.
- **Geragogik-UI:** `VocabTrainerClient` zeigt Phase und Fortschritt ruhig an, arbeitet mit Tap-to-Select (kein Drag-and-Drop), Touch-Targets ab 64px und einer 24px-Kartenfrage. Nach jeder Antwort erklärt ein Hinweis in Klartext, was passiert ist („Zurück in Phase 3. Du siehst diese Vokabel morgen wieder."). Kein Timer, keine Bestenliste, kein rotes Fehler-Feedback.
- **Route-Vollständigkeit:** `error.tsx` und `loading.tsx` (Skeleton) für `/dashboard/level/[level]/vocabulary` und `.../vocabulary/train`.
- **i18n:** 45 neue Keys unter `vocabulary` in `dictionaries/{de,en,ru,uk,tr}.json`; Interpolation über `lib/vocabulary-i18n.ts`.
- **Tests:** `__tests__/leitner.test.ts` (17 Tests) sichert Intervalle, Aufstieg, die Ein-Phasen-Rückstufung, die Untergrenze Phase 1 und die Migrations-Neuberechnung ab.
- **DB-Migration:** `supabase/migrations/add_phase6_leitner.sql` (additiv: `user_vocabulary_progress.lapses`, `.last_answered_at`, Index `idx_user_vocabulary_progress_due`, Neuberechnung der Termine per `LEAST`). **Noch nicht am Live-Projekt ausgeführt.**

## 3c. Sprachübungen & Lehrer-Feedback (abgeschlossen, Schritt 3)
- **Waveform-Tonspur:** `lib/audio/waveform.ts` liefert die Verdichtung auf 48 Balken (Spitzenwert je Abschnitt, nicht Mittelwert), die Normalisierung auf den lautesten Balken und die Pegelberechnung aus dem `AnalyserNode`. Bewusst reine Funktionen ohne Browser-APIs, damit sie testbar bleiben.
- **Zwei Darstellungen:** `LiveWaveform` zeigt die Aufnahme im Verlauf (`AnalyserNode`, ein Balken je ~110 ms, füllt von links und scrollt erst wenn voll). `WaveformPlayer` zeigt die fertige Datei mit eingefärbtem Fortschritt, Zeitanzeige, Tempo-Umschalter (1×/0,75×/1,25×) und Sprung per Tap. Umsetzung als `div`-Balken statt Canvas: skaliert auf Retina ohne Zusatzlogik und trägt echte ARIA-Semantik (`role="slider"` mit `aria-valuetext`, Pfeiltasten springen 5 Sekunden).
- **Entdoppelte Aufnahme-Logik:** `getUserMedia`, `MediaRecorder` und Analyser lagen doppelt in `AudioRecorder` und `PendingSubmissionCard`. Beide nutzen jetzt den Hook `lib/audio/useAudioRecorder.ts`, der MIME-Type-Auswahl (webm/opus → webm → mp4 für Safari), Mikrofon-Freigabe, Fehlerzustände und das Freigeben von Stream, AudioContext und Object-URL kapselt.
- **Zentraler Upload:** `lib/audio/upload.ts` bündelt den Storage-Upload. Die Pfad-Schemata (`{userId}-{timestamp}` bzw. `feedback/{submissionId}_{timestamp}`) sind unverändert, damit die bestehenden Storage-Policies weiter greifen.
- **Ein Korrektur-Loop statt zwei:** `/admin/feedback` war ein zweites, veraltetes Lehrer-Dashboard (nur Text-Feedback, rohes `<audio>`, `any`). Die Route leitet jetzt dauerhaft auf `/admin/submissions` um; alte Lesezeichen funktionieren weiter.
- **Dashboard-Benachrichtigung:** `teacher_feedback.seen_at` trägt den Gelesen-Status. `getUnseenFeedbackSummary` zählt offene Rückmeldungen, `FeedbackNotificationCard` zeigt sie als erklärende Karte über dem Niveau-Raster („Du hast eine neue Sprachnachricht erhalten") mit direktem Link auf das betroffene Sprachniveau – kein roter Zähler am Menüpunkt.
- **Gelesen-Markierung ohne Schreibrechte:** Der Schüler erhält keine UPDATE-Policy auf `teacher_feedback`. Das Setzen von `seen_at` läuft über die SECURITY-DEFINER-Funktion `mark_feedback_seen(uuid)`, die nur eigene Einreichungen und nur diese eine Spalte anfasst. Die „Neu"-Markierung bleibt für den laufenden Seitenaufruf sichtbar, damit der Hinweis nicht vor den Augen des Lernenden verschwindet.
- **Strict Typing & Fehlerbehandlung:** `app/actions/feedback.ts` ist vollständig typisiert (`lib/types/feedback.ts`), `any` ist entfernt, jede Action liegt in try/catch und gibt statt roher DB-Meldungen eine Kennung (`not_authenticated` | `save_failed` | `invalid_input`) zurück. Die E-Mail-Benachrichtigung ist gekapselt und kann die Feedback-Freigabe nicht mehr blockieren; ihr Deep-Link zeigt jetzt auf die korrekte Level-Route statt auf den alten Pfad `/dashboard/pronunciation`.
- **Route-Vollständigkeit:** `error.tsx` und `loading.tsx` (Skeleton) für `/dashboard/level/[level]/pronunciation`.
- **i18n:** 49 neue Keys unter `pronunciation` in `dictionaries/{de,en,ru,uk,tr}.json`; Interpolation über `lib/pronunciation-i18n.ts`. Die Aussprache-Seite enthält keine hartcodierten Strings mehr.
- **Tests:** `__tests__/waveform.test.ts` (22 Tests) sichert Peak-Verdichtung, Normalisierung, Balkenhöhen, Pegelberechnung, Zeitformatierung und Sprungposition ab.
- **DB-Migration:** `supabase/migrations/add_feedback_notifications.sql` (additiv: `teacher_feedback.seen_at`, partieller Index auf ungelesene Zeilen, Index `idx_submissions_user_level_created`, Funktion `mark_feedback_seen`, Backfill für Feedback älter als 7 Tage).
- **Security-Advisor sauber:** `mark_feedback_seen` ist mit `search_path = ''` und einem expliziten `REVOKE ... FROM anon` gehärtet. Der Hinweis „Public Can Execute SECURITY DEFINER Function" ist für diese Funktion erledigt; der verbleibende Hinweis für `authenticated` ist beabsichtigt, denn genau der eingeloggte Schüler soll den Gelesen-Status setzen.

## 3d. Authentifizierung produktionsreif (2026-09-02)
- **Ursache der localhost-Mails:** Der live deployte `signup` setzte `emailRedirectTo` auf `http://localhost:3000/auth/confirm`, sobald `NEXT_PUBLIC_SITE_URL` fehlte. Zusätzlich behandelte die Middleware `?lang=de` als Legacy-Startseiten-URL und leitete `/auth/confirm?lang=de` per 301 auf `/de` um – das Einmal-Token war weg, noch bevor die Confirm-Route es lesen konnte. Die Confirm-Route verstand nur `token_hash`, die Mails liefern aber den PKCE-`code`.
- **Fix App:** `getOutboundSiteUrl()` in `lib/site-url.ts` erzeugt Auth-Links nie mit localhost; Fallback ist `https://www.sitov-academy.com`. `netlify.toml` setzt `NEXT_PUBLIC_SITE_URL` für Production-Builds.
- **Fix Routing:** `lib/locale-routing.ts` nimmt `/auth` von Locale- und `?lang=`-Redirects aus. Matcher und Laufzeitlogik greifen doppelt. `/admin` ist für Unangemeldete geschützt.
- **Fix Confirm:** `app/auth/confirm/route.ts` und `/auth/callback` tauschen PKCE-Codes und Token-Hashes, leiten über `NEXT_PUBLIC_SITE_URL` weiter und schicken nach Erfolg direkt auf `/{lang}/dashboard`.
- **Fix 404 der Lernrouten:** `/de/login`, `/de/register` und `/de/dashboard` antworten auf der Live-Site derzeit mit einer vorgerenderten 404. Auth- und Dashboard-Layouts sind `force-dynamic`, damit Netlify sie als Server-Funktion ausliefert statt als statische Leerstelle.
- **Supabase (kein SQL):** Site URL und Redirect-Allowlist müssen in Authentication → URL Configuration auf `https://www.sitov-academy.com` stehen. Die Vorlagen in `supabase/templates/` müssen ins Dashboard kopiert werden; sie nutzen `token_hash` und `RedirectTo`, damit der Link auch auf einem anderen Gerät (Tablet) funktioniert.
- **Tests:** `__tests__/site-url.test.ts`, `__tests__/locale-routing.test.ts`, `__tests__/auth-i18n.test.ts`, `__tests__/auth-callback.test.ts`, `__tests__/supabase-env.test.ts`.

## 4. Bekannte Bugs & Unvollständige Implementierungen (Tech Debt)
- **Lehrer-Oberfläche ohne i18n:** `SubmissionsDashboard` und `PendingSubmissionCard` enthalten weiterhin deutsche Strings im Code. Bewusst zurückgestellt, da die Korrektur-Ansicht ausschließlich von deutschsprachigen Lehrkräften genutzt wird.
- **Übungstyp `sentence_building`:** Im Schema und CMS vorhanden, aber noch ohne Studenten-UI. Solche Übungen werden derzeit serverseitig übersprungen und protokolliert, damit keine leere Karte erscheint.
- **Fehlende UI-Politur (Smartphone):** Viele Views sind noch Desktop-first (enge Zeilen, Overflow, kleine Abstände). Der Agent `.cursor/rules/ux-smartphone-agent.mdc` gilt für `app/**/*.tsx` und `components/**/*.tsx` und erzwingt Mobile-First (375px), Stapeln unter `md:`, Safe-Area und 48px-Targets. Geragogik bleibt in `ux-geragogik-agent.mdc`.
- **Hardcodierte Strings:** `app/[lang]/dashboard/level/[level]/page.tsx` enthält weiterhin deutsche Kachel-Texte im Code statt Dictionary-Keys.
- **Teacher-Dashboard Vollständigkeit:** Das Korrigieren von Audio-Einsendungen ist umgesetzt; es fehlt weiterhin das feingranulare UI zur Verwaltung von Schülern (z.B. Abo-Status anzeigen).
- **Stripe-Integration:** Die Basis-Bibliothek ist installiert, aber der vollständige Webhook-Workflow und das Paywall-Blocking auf Serverseite sind noch nicht vollständig implementiert.
- **Strict Typing:** Generierte Supabase-Types (`supabase/database.types.ts`) sind an alle Client-Factory-Funktionen (`utils/supabase/*`) angebunden. `app/actions/exercises.ts`, `app/actions/vocabulary.ts` und `addExercise` in `app/actions/cms.ts` sind vollständig typisiert; `addVocab` und `addVideo` nutzen weiterhin `any` und stehen zur Umstellung an (Zero-Error-Policy).

## 5. Hosting
- Die Lernplattform läuft auf **Netlify** (`netlify.toml`, `@netlify/plugin-nextjs`). `NEXT_PUBLIC_SITE_URL` ist dort auf `https://www.sitov-academy.com` gesetzt. Derselbe Satz gilt für Vercel Production (Dashboard → Environment Variables).
- Caching muss für Server Components (z.B. Kurslisten) korrekt eingestellt werden, um Ladezeiten zu minimieren.

### Checkliste: Umgebungsvariablen für den Live-Betrieb (Vercel / Netlify)

Pflicht für Anmeldung, Registrierung und E-Mail-Bestätigung:

| Variable | Wert (Produktion) | Wo |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.sitov-academy.com` | Vercel Production **und** Preview; ohne diesen Wert entstehen localhost-Links in Auth-Mails |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wcaslabeiwtvygxtzcio.supabase.co` | öffentlich, Browser-Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/Publishable Key aus Supabase → Settings → API | öffentlich, Browser-Client |

Aliase, die der Code ebenfalls akzeptiert (falls im Dashboard so benannt): `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Der `NEXT_PUBLIC_`-Name hat Vorrang.

Zusätzlich serverseitig (nicht `NEXT_PUBLIC_`, nie ins Git):

| Variable | Zweck |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-Client, Stripe-Webhook |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Zahlungen |
| `SMTP_*` / `UPSTASH_*` | Lehrer-Mails, Ratenbegrenzung |

In Supabase Authentication → URL Configuration müssen Site URL und Redirect-Allowlist auf `https://www.sitov-academy.com` zeigen (`/auth/confirm` und `/auth/callback` einschließen).
