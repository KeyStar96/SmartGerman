# Current State Analysis (Ist-Zustand)

## 1. Übersicht
Das Repository "Sitov Academy" ist eine Next.js (App Router) basierte Webanwendung, die als Lernplattform für die "Sitov Language Academy" dient. Der aktuelle Stand bildet die Basis für eine Transition in eine produktionsreife und monetarisierbare Umgebung, optimiert für eine Zielgruppe im besten Alter (Fokus: Geragogik, Barrierefreiheit, klare Strukturen).

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
- **Vokabeltrainer A1.1:** Live-Inhalt sind die Lernsets **Lektion 1** (84 Karten), **Lektion 2** (85 Karten: Befinden, Familie, Zahlen) und **Lektion 3** (76 Karten: Lebensmittel, Geschäfte, Mengen, Verben & Redemittel beim Einkaufen). Seed-SQL: `supabase/seeds/a11_lektion_1.sql`, `a11_lektion_2_familie.sql`, `a11_lektion_3_einkauf.sql`. Migration: `supabase/migrations/move_einkauf_vocab_to_a11_lektion_3.sql`.
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
- **Tests:** `__tests__/waveform.test.ts` sichert Pegelberechnung aus dem `AnalyserNode`, Zeitformatierung, Sprungposition und die Frame-Glättung (`smoothTowards`) ab. (Peak-Verdichtung/Normalisierung/Balkenhöhen-Tests entfernt am 2026-09-03, da die zugehörigen Balken-Funktionen mit dem Umstieg auf `FluidWaveform` toter Code wurden, siehe 4e.)
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
- **Smartphone-Lernplattform (2026-09-02):** Dashboard-Hülle, Niveau-Kacheln, Videos, Profil, Übungen, Vokabeltrainer und Aussprache sind Mobile-First (375px): gestapelte Header-Zeile, 48px-Targets, `min-h-dvh`, Safe-Area, volle Primärbuttons, `break-words`. Profil ist über das Header-Icon erreichbar. Die alte Route `/dashboard/lessons` leitet auf die Niveau-Übersicht um.
- **i18n Lernplattform:** Hartcodierte deutsche Strings in Layout, Level-Kacheln, Videos, Profil und Premium liegen in `dictionaries/{de,en,ru,uk,tr}.json` unter `dashboard`, `videos` und `profile`. Helfer: `lib/dashboard-i18n.ts`, `lib/videos-i18n.ts`, `lib/profile-i18n.ts`. Der Dashboard-Titel nutzt `title_before`/`title_highlight` statt HTML mit ungültigem `className`. Russisch: Tippfehler „алфавіт“ → „алфавит“.
- **Video-Routen:** Interne Videos zeigen auf `/dashboard/level/[level]/videos/[id]` (vorher `/dashboard/videos/[id]`, 404). Der Player ist ein Server Component plus Client ohne `any`.
- **Lehrer-Oberfläche ohne i18n:** `SubmissionsDashboard` und `PendingSubmissionCard` enthalten weiterhin deutsche Strings im Code. Bewusst zurückgestellt, da die Korrektur-Ansicht ausschließlich von deutschsprachigen Lehrkräften genutzt wird.
- **Übungstyp `sentence_building`:** Im Schema und CMS vorhanden, aber noch ohne Studenten-UI. Solche Übungen werden derzeit serverseitig übersprungen und protokolliert, damit keine leere Karte erscheint.
- **Marketing-Landing & Admin:** Die öffentliche Startseite und das Lehrer-Dashboard sind noch nicht vollständig auf 320px/375px nachgezogen; der Smartphone-Agent gilt weiter für neue UI-Änderungen.
- **Teacher-Dashboard Vollständigkeit:** Das Korrigieren von Audio-Einsendungen ist umgesetzt; es fehlt weiterhin das feingranulare UI zur Verwaltung von Schülern (z.B. Abo-Status anzeigen).
- **Stripe-Integration:** Die Basis-Bibliothek ist installiert, aber der vollständige Webhook-Workflow und das Paywall-Blocking auf Serverseite sind noch nicht vollständig implementiert.
- **Strict Typing:** Generierte Supabase-Types (`supabase/database.types.ts`) sind an alle Client-Factory-Funktionen (`utils/supabase/*`) angebunden. `app/actions/exercises.ts`, `app/actions/vocabulary.ts` und `addExercise` in `app/actions/cms.ts` sind vollständig typisiert; `addVocab` und `addVideo` nutzen weiterhin `any` und stehen zur Umstellung an (Zero-Error-Policy).

## 4a. Dashboard-Header-Layout (2026-09-03, behoben)
- **Fehler:** Logo, Breadcrumb-Navigation, Profil-Icon und „Abmelden“ klebten im `DashboardLayout`-Header linksbündig zusammen, da der Container kein `justify-between` nutzte und `DashboardHeader` doppelt (mit inkonsistenten `sm:`/`md:`-Breakpoints) gerendert wurde.
- **Fix:** `app/[lang]/dashboard/layout.tsx` nutzt jetzt einen einzigen `flex flex-wrap justify-between`-Container mit `order-*`-Klassen: Logo (`order-1`) ganz links, Profil/Theme/Abmelden (`order-2` mobil / `order-3` ab `md:`) ganz rechts, Breadcrumb (`order-3 basis-full` mobil / `order-2 md:basis-auto` ab `md:`) mittig zwischen den beiden Blöcken. `DashboardHeader.tsx` wird nur noch einmal instanziiert; sein interner Breakpoint ist auf `md:` vereinheitlicht (vorher `sm:`, Mismatch mit dem Layout).
- **Mobile:** Auf dem Smartphone bricht die Navigation automatisch in eine eigene volle Zeile unterhalb von Logo/Profil-Block um (`basis-full`) – kein Quetschen, kein horizontales Scrollen, kein zusätzliches Burger-Menü nötig.

## 4b. Audio-Upload-Fehler behoben (2026-09-03)
- **Ursache:** `lib/audio/upload.ts` sendete den vollen `MediaRecorder`-MIME-Type inkl. Codec-Parameter (z.B. `audio/webm;codecs=opus`) als `Content-Type` an Supabase Storage. Storage-Fehler wurden zudem nur mit einer einzeiligen `error.message` geloggt – Bucket, Pfad und Statuscode fehlten, was die Fehlersuche im Live-Betrieb erschwerte.
- **Fix Upload:** Neue Hilfsfunktion `baseMimeType()` reduziert den MIME-Type vor dem Senden auf den reinen Basistyp (`audio/webm` bzw. `audio/mp4`); `extensionForMimeType()` nutzt dieselbe Basis für die Dateiendung. `.upload()` läuft jetzt mit `upsert: true`, damit ein erneuter Versand unter demselben Pfad nicht an einem „Resource already exists“-Fehler scheitert.
- **Fix Logging:** Jeder Fehlerpfad (fehlende Sitzung, Storage-Fehler, Netzwerk-/Laufzeitfehler) loggt jetzt strukturiert über `console.error` mit Bucket, Pfad, `blob.type`, `contentType`, Blob-Größe und den verfügbaren Fehlerfeldern (`name`, `message`, `status`). `AudioRecorder.tsx` loggt zusätzlich den Ablaufkontext (Upload- vs. Speichern-Schritt) und fängt jetzt auch Netzwerkfehler beim Aufruf der Server Action `submitAudioUrl` ab (vorher unbehandelte Promise-Rejection möglich).
- **Bucket-Name verifiziert:** Code (`AUDIO_BUCKET = 'audio_submissions'`) und Live-Bucket stimmen überein (Unterstrich, kein Bindestrich). Kein Rename notwendig.
- **DB-Migration:** `supabase/migrations/fix_audio_submissions_storage_policies.sql` (idempotent) am Live-Projekt ausgeführt: Bucket-Existenz + `public = true` sichergestellt, INSERT- und neue UPDATE-Policy (für `upsert: true`) für `authenticated`, SELECT-Policy für `public` neu gesetzt.

## 4c. Vokabeltrainer: Detailansicht, manuelle Übernahme & Einstufungs-Modus (2026-09-03)
- **Lektions-Detailansicht:** Jede Lektion in `LessonList` (`components/vocabulary/LessonList.tsx`, ersetzt die frühere Inline-Liste in `page.tsx`) lässt sich per Button öffnen – als Modal (`LessonCardsModal`, siehe 4e, seit 2026-09-03; ursprünglich als Inline-Akkordeon umgesetzt). Beim Öffnen lädt die neue Server Action `getLessonCards(lesson, level)` alle Vokabeln der Lektion inklusive persönlichem Lernstand; jede Karte zeigt ein Phasen-Badge (Phase 1–6 farblich gestuft von Amber über Blau bis Grün, „Gelernt" in kräftigem Grün) oder – falls noch nicht übernommen – einen „Aufnehmen"-Button.
- **Manuelle Einzelvokabel-Übernahme:** Der „Aufnehmen"-Button je Vokabel ruft die neue Server Action `addCardsToTrainer(cardIds)` auf und legt genau diese eine Karte sofort in Phase 1 an (optimistisches UI-Update ohne Neuladen der Liste, `router.refresh()` synchronisiert danach die Lektions-Statistik).
- **„Vokabeln einstufen"-Modus (Pre-Assessment):** Neue Route `/dashboard/level/[level]/vocabulary/assess?lesson=…` (Server-Page + `LessonAssessmentClient`, jeweils mit `loading.tsx`/`error.tsx`). Der Lernende sieht unbearbeitete Vokabeln der Lektion nacheinander (Wort + Übersetzung gleichzeitig sichtbar) und entscheidet: „Kenne ich schon" (Server Action `submitLessonAssessment` setzt die Karte direkt auf Box 7/„gelernt" mit regulärer Phase-6-Ruhezeit) oder „In Karteikasten aufnehmen" (Start in Phase 1, sofort fällig). Jede Entscheidung wird einzeln und sofort gespeichert, ein Abbruch mittendrin verliert keinen Fortschritt. Der Lektions-Button in der Übersicht heißt „Vokabeln einstufen" (unberührte Lektion) bzw. „Weitere Vokabeln einstufen" (teilweise übernommen) und ersetzt den früheren Sofort-Start-Button.
- **Strict Typing:** Neue Typen `LessonCardView`, `AddCardsResult`, `AssessmentDecision`, `SubmitAssessmentResult` in `lib/types/vocabulary.ts`; alle drei neuen Server Actions in `app/actions/vocabulary.ts` sind vollständig typisiert, in try/catch gekapselt und loggen Fehler serverseitig mit Kontext.
- **DRY-Refactor:** `articleColorClass` (Artikelfarben) lag dupliziert in `VocabTrainerClient`; jetzt zentral in `lib/vocabulary-ui.ts` zusammen mit der neuen `phaseBadgeClasses`-Hilfsfunktion, von `VocabTrainerClient`, `LessonList` und `LessonAssessmentClient` gemeinsam genutzt.
- **i18n:** 27 neue Keys unter `vocabulary` in `dictionaries/{de,en,ru,uk,tr}.json` (Detailansicht, manuelle Übernahme, Einstufungs-Modus), Fallbacks in `lib/vocabulary-i18n.ts`. Keine hartcodierten Strings.
- **Geragogik-UX:** Alle neuen interaktiven Elemente (Aufnehmen-Button, Aufklapp-Button, Einstufen-Buttons) sind mindestens 48px hoch, Schriftgrößen ab 18px (`text-lg`/`text-xl`), klare Kontraste (Amber/Blau/Grün-Badges), Fokusringe in Markenfarbe `#FF5C00`.
- **Zero-Error-Bugfix nebenbei:** `components/audio/AudioRecorder.tsx` hatte einen echten TypeScript-Fehler (`upload.reason` auf dem Erfolgs-Zweig des discriminated union `AudioUploadResult`). Behoben durch explizite Prüfung `upload.success === false`.

## 4d. Supabase-Browser-Client-Fix & Siri-Style Live-Waveform (2026-09-03)
- **Ursache Fehler „URL and API key are required":** `utils/supabase/client.ts` las `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` über die gemeinsame Hilfsfunktion `readSupabasePublicConfig()` (`env = process.env as SupabasePublicEnv`, dann `env.NEXT_PUBLIC_SUPABASE_URL`). Next.js ersetzt `NEXT_PUBLIC_`-Variablen im Browser-Bundle aber **nur** bei wortwörtlichem `process.env.NEXT_PUBLIC_XXX`-Zugriff zur Build-Zeit (Turbopack-Textmuster-Ersetzung, keine Datenfluss-Analyse). Über die Zwischenfunktion blieben beide Werte im Browser zur Laufzeit `undefined`, `createBrowserClient('', '')` schlug fehl – serverseitig (Server Components, Middleware, Admin-Client) trat der Fehler nie auf, weil dort zur Laufzeit ein echtes `process.env` existiert.
- **Fix:** `utils/supabase/client.ts` liest die beiden Variablen jetzt **direkt und literal** (`process.env.NEXT_PUBLIC_SUPABASE_URL!`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`-Muster, aber mit sauberer Prüfung statt Non-Null-Assertion). Fehlen sie, wird ein verständlicher `console.error` (inkl. `hasUrl`/`hasAnonKey`) geloggt und ein neuer, typisierter `SupabaseConfigError` geworfen – kein unkontrollierter Absturz. `lib/audio/upload.ts` fängt genau diesen Fehlertyp ab und liefert dem UI den eigenen Grund `reason: 'not_configured'` (statt eines generischen `upload_failed`), sodass sich Konfigurationsfehler in den Server-Logs sofort von echten Storage-Fehlern unterscheiden lassen; die Studenten sehen weiterhin nur die freundliche Standardmeldung. `lib/supabase-env.ts` trägt jetzt einen Warnhinweis, dass es ausschließlich serverseitig verwendet werden darf.
- **Plattformunabhängig:** Der Fix hängt an keiner Vercel- oder Netlify-Spezifik – beide führen denselben Next.js-Build aus und müssen `NEXT_PUBLIC_*` lediglich zur **Build-Zeit** bereitstellen (Vercel: „Shared" Environment Variables mit Build-Freigabe; Netlify: `@netlify/plugin-nextjs` liest dieselben Variablen). `.env.example` und der Kommentar in `client.ts` weisen jetzt explizit darauf hin.
- **Test:** Neuer `__tests__/supabase-client.test.ts` (mockt `@supabase/ssr`) prüft: fehlende Variable(n) → `SupabaseConfigError` + `console.error`; beide gesetzt → `createBrowserClient` wird mit den korrekten Werten aufgerufen.
- **Siri-Style Live-Waveform:** `components/audio/LiveWaveform.tsx` ist von DOM-Balken auf ein `<canvas>` umgestellt. Drei phasenverschobene, sanft schwingende Sinus-Wellen (Web Audio API: `AnalyserNode.getByteTimeDomainData`, ausgewertet über die bestehende `levelFromTimeDomain()`) werden jeden Frame per `requestAnimationFrame` neu gezeichnet; die Amplitude nähert sich per neuer Hilfsfunktion `smoothTowards()` (`lib/audio/waveform.ts`, mit Unit-Tests) weich an den aktuellen Mikrofon-Pegel an, statt zu springen. Farbschema: leuchtender Orange-Verlauf (`rgba(255,122,26,…)`) mit `shadowBlur`-Glow auf transparentem Grund. `useAudioRecorder.ts` gibt dafür neu `analyserRef` (Live-`AnalyserNode`) nach außen frei; `AudioRecorder.tsx` und `PendingSubmissionCard.tsx` reichen ihn an `LiveWaveform` durch. Ohne Analyser (Browser ohne AudioContext) fällt die Komponente auf den letzten Wert aus `levels` zurück – keine Regression für ältere Browser.
- **Cleanup:** Die Canvas-Animation räumt sich selbst auf (`cancelAnimationFrame` + `ResizeObserver.disconnect()` im Effect-Cleanup); Mikrofon-Stream und `AudioContext` werden weiterhin zentral von `useAudioRecorder`s `teardown()` freigegeben (`stream.getTracks().forEach(t => t.stop())`, `audioContext.close()`) – keine doppelte Verantwortung für dieselbe Ressource.
- **Geragogik:** Respektiert `prefers-reduced-motion` (langsamere Phase, stärkere Glättung statt kompletter Bewegungslosigkeit, damit die Rückmeldung „es nimmt gerade auf" erkennbar bleibt). *(Am 2026-09-03 wurde die Canvas-Wave aus `LiveWaveform` in die wiederverwendbare `FluidWaveform` extrahiert und auch für `WaveformPlayer` übernommen, siehe 4e – der letzte Satz zu „`WaveformPlayer` bleibt Balken-basiert" ist damit überholt.)*

## 4e. Unified Siri-Waveform, Vokabeltrainer-Bugfix, No-Scroll-Layout & Re-Branding (2026-09-03)

**1. Unified Siri-Waveform (`FluidWaveform`):**
- Die Canvas-Wellen-Logik aus `LiveWaveform` wurde in eine eigenständige, datenquellen-agnostische Komponente `components/audio/FluidWaveform.tsx` extrahiert. Sie nimmt nur noch eine `getVolume(): number`-Callback-Prop (0–1 je Frame) und `isActive` entgegen – woher der Pegel kommt, entscheidet der Aufrufer.
- `LiveWaveform` ist jetzt ein dünner Wrapper: liest den Pegel aus dem echten `AnalyserNode` (Fallback: `levels`-Array) und reicht ihn an `FluidWaveform` weiter.
- `WaveformPlayer` (Wiedergabe fertiger Aufnahmen) nutzt jetzt ebenfalls `FluidWaveform` statt der alten `div`-Balken. Die Wellenbewegung während der Wiedergabe ist eine **bewusste Sinus-Simulation** (zwei überlagerte, leicht verstimmte Sinusfrequenzen), **kein** echter `AnalyserNode` am `<audio>`-Element: Das hätte die Wiedergabe über `createMediaElementSource()` in den Web-Audio-Graphen umgeleitet – Stummschaltungsrisiko bei fehlendem `resume()`, nur eine Quelle pro Element über alle Re-Renders hinweg möglich, CORS-Abhängigkeit vom Storage-Bucket für echte Frequenzdaten. Für die Kernfunktion „Aufnahme anhören" zu riskant; die Aufgabenstellung erlaubte die Sinus-Simulation explizit als Alternative.
- Seek-Interaktion bleibt vollständig erhalten (`role="slider"`, Klick auf die Welle, Pfeiltasten ±5s, `Home`), nur die Balken-Darstellung wurde ersetzt; eine schmale Fortschritts-Leiste unter der Welle zeigt weiterhin, wie weit die Wiedergabe fortgeschritten ist.
- Performance: `FluidWaveform` animiert nur, während `isActive` true ist; im inaktiven Zustand (Pause, oder mehrere `WaveformPlayer` gleichzeitig in `SubmissionHistory`) wird ein einzelner ruhiger Frame gezeichnet statt einer Dauerschleife.
- Aufräumen: `extractPeaks`, `normalizePeaks`, `barHeightPercent`, `WAVEFORM_MIN_BAR_PERCENT` aus `lib/audio/waveform.ts` entfernt (toter Code nach dem Umstieg von Balken auf Canvas-Wellen); zugehörige Tests in `__tests__/waveform.test.ts` mitentfernt. `WAVEFORM_BAR_COUNT`/`appendLevel` bleiben (Fallback-Datenquelle `levels` in `useAudioRecorder`).

**2. Bugfix „grauer Balken" im Vokabeltrainer:**
- Ursache: In `LessonList.tsx` stand der Lern-Fortschrittsbalken in derselben Button-Reihe wie „Vokabeln anzeigen". Ohne grüne Füllung (0% gelernt, aber schon Karten „im Training") sah er wie ein eingefrorener Lade-Platzhalter direkt neben dem Button aus.
- Fix: Der Fortschrittsbalken (dünner, `h-2`, mit Prozent-Zahl daneben) steht jetzt unterhalb der Lektions-Kennzahlen im Textblock, komplett getrennt von der Button-Reihe.

**3. Vokabeltrainer-Redesign & No-Scroll-Viewport (Desktop `lg:`):** *(Layout-Ansatz am selben Tag durch 4f wieder aufgehoben, siehe unten – der `LessonCardsModal` bleibt bestehen.)*
- Die Lektions-Detailliste war ein Inline-Akkordeon, das die Übersichtsseite bei vielen Vokabeln beliebig lang zog. Ersetzt durch `components/vocabulary/LessonCardsModal.tsx`: ein zentriertes Overlay (`role="dialog"`, ESC schließt, Klick außerhalb schließt) mit fester Kopfzeile und einem intern scrollenden Listbereich. `LessonList.tsx` verwaltet nur noch, welche Lektion geöffnet ist (`openLesson`), keine verschachtelte Karten-Ladezustände mehr pro Zeile.
- Alle vier Trainer-Hauptansichten (`vocabulary`, `vocabulary/train`, `vocabulary/assess`, `pronunciation`, `exercises`, `videos`) hatten ab `lg:` das Muster `lg:h-[calc(100vh-5rem)] lg:overflow-hidden flex flex-col` erhalten. **Dieses Muster wurde am selben Tag (siehe 4f) wieder entfernt**, da es auf MacBook/Laptop-Displays Inhalte abschnitt und das Trackpad-Scrollen blockierte.
- Betroffene Dateien: `app/[lang]/dashboard/level/[level]/vocabulary/page.tsx`, `.../vocabulary/train/page.tsx`, `.../vocabulary/assess/page.tsx`, `.../pronunciation/page.tsx`, `.../exercises/page.tsx`, `.../videos/page.tsx`.

**4. Re-Branding „SmartGerman" → „Sitov Academy":**
- Alle 22 Fundstellen des Begriffs „SmartGerman" im Repository (Komponenten, i18n-Fallbacks/Dictionaries, Alt-Texte, `.cursor/rules/*.mdc`, `.cursorrules`, SQL-Migrationskommentare, `ARCHITECTURE.md`/`CURRENT_STATE.md`/`MONETIZATION.md`/`SITOV_LANGUAGE_ACADEMY_MASTER_GUIDELINE.md`, `.env.example`) wurden durch „Sitov Academy" ersetzt.
- Bewusst unverändert: `package.json`-Projektname (bereits `sitov-language-academy`), die Supabase-Projekt-ID `wcaslabeiwtvygxtzcio`, sowie der externe Telegram-Link `t.me/smartgerman_hannover` (realer Kanalname eines Drittanbieters, keine Textersetzung möglich ohne den Link zu brechen).

**Qualitätssicherung:** `npx tsc --noEmit` fehlerfrei, `npx jest` (446 Tests grün, ein vorbestehender, umgebungsabhängiger Integrationstest ohne `SUPABASE_SERVICE_ROLE_KEY` weiterhin rot), `next build` erfolgreich.

## 4f. Rücknahme des No-Scroll-Layouts, Trainer-Feinschliff & Textfix (2026-09-03)

**1. Rücknahme der starren Viewport-Sperre:**
- Nutzer-Feedback: Das `lg:h-[calc(100vh-5rem)] lg:overflow-hidden`-Muster aus 4e funktionierte auf MacBook/Laptop-Displays nicht zuverlässig – Inhalte wurden unten abgeschnitten, das Trackpad-/Mausrad-Scrollen reagierte inkonsistent.
- Fix: In allen sechs Trainer-Seiten (`vocabulary`, `vocabulary/train`, `vocabulary/assess`, `pronunciation`, `exercises`, `videos`) entfernt und durch flexible Container ersetzt (`min-h-screen w-full py-8`, kein `overflow-hidden` auf Container-Ebene). Die Seiten scrollen jetzt wieder ganz normal mit dem Browser/Trackpad, auf allen Bildschirmgrößen identisch.

**2. Karteikarten- & Aussprache-Trainer – Layout-Feinschliff:**
- `VocabTrainerClient.tsx`: Karte kompakter gestaltet (kleinere Innenabstände, kleineres Bild, engere Abstände zwischen Wort/Buttons), damit sie auf 13"/14"-Laptops möglichst komplett sichtbar ist. `vocabulary/train/page.tsx` zentriert die Karte jetzt über `flex flex-1 items-center justify-center` (mit `min-h-`, nicht `h-`) vertikal im sichtbaren Bereich – wächst der Inhalt doch über den Viewport hinaus, scrollt die Seite einfach natürlich statt abzuschneiden.
- `pronunciation/page.tsx`: Kopfbereich, Hero-Karte, Recorder und die Sektion „Deine bisherigen Einreichungen" sind jetzt ein einziger natürlich fließender Block (`space-y-10`); die Einreichungen stehen unter der Aufnahme-Box und scrollen mit der Seite.

**3. Textfix „Lektion Lektion 2":**
- Ursache: `vocabulary_cards.lesson`/`videos.lesson` werden von der Lehrkraft bereits als vollständiger String (`"Lektion 2"`) gepflegt. Die `lesson_label`-Übersetzung (`"Lektion {lesson}"` bzw. `"Lesson {lesson}"` etc.) fügte selbst noch ein Präfix hinzu → Dopplung.
- Fix: Neue Hilfsfunktion `stripLessonPrefix()` in `lib/utils.ts` entfernt ein führendes „Lektion" (case-insensitive) aus dem Rohwert, bevor er in die Übersetzung eingesetzt wird. Angewendet an allen 5 Stellen, die `t('lesson_label', …)` nutzen: `VocabTrainerClient.tsx`, `LessonAssessmentClient.tsx`, `videos/page.tsx` (×2), `videos/[id]/page.tsx`.

**4. Vokabeltrainer-Übersicht & Modal-Fix:**
- Leerer „0%"-Fortschrittsbalken entfernt: `LessonList.tsx` zeigt den Lernfortschrittsbalken jetzt erst, wenn `stat.learned > 0` ist (statt bei jedem `active > 0`) – kein leerer, unfertig wirkender Balken mehr direkt nach Übernahme einer Lektion.
- `LessonCardsModal.tsx`: Modal-Höhe auf `max-h-[80vh]` begrenzt (`flex flex-col` mit `shrink-0`-Kopfzeile), der Listenbereich hat jetzt explizit `flex-1 overflow-y-auto` statt einer festen `max-h-[400px]` – scrollt auf allen Bildschirmgrößen flüssig per Trackpad/Mausrad, ohne das Modal selbst zu sprengen.

**Qualitätssicherung:** `npx tsc --noEmit` fehlerfrei, `npx jest` (446 Tests grün, derselbe vorbestehende Integrationstest ohne `SUPABASE_SERVICE_ROLE_KEY` weiterhin rot), `next build` erfolgreich.

## 4g. Vokabel-Modal: Scroll-Fix, Tabs, eigene Vokabeln & Phasen-Diagramm (2026-09-03)

**Ursache des Scroll-Problems:** Der Dialog war bereits `flex flex-col` mit `max-h`, dem Body fehlte aber `min-h-0` (Flex-Kinder defaulten auf `min-height: auto` und lassen sich nicht unter die Inhaltsgröße stauchen). Zusätzlich fängt Lenis auf Desktop (`SmoothScroll.tsx`, `smoothWheel: true`) Wheel-Events ab – ohne `data-lenis-prevent` kommt die Geste nie im inneren Scrollbereich an.

**Layout:** Dialog `max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden`. Header (Titel, Tabs, Schließen) `flex-shrink-0`. Body `flex-1 min-h-0 overflow-y-auto overscroll-contain` plus `.modal-scroll-region` (`-webkit-overflow-scrolling: touch`). Backdrop sperrt Body-Scroll (`overflow: hidden`) und schluckt Wheel-Events nur auf der Abdunklung selbst, nicht auf dem Dialog.

**Tabs:** „Wörterliste" und „Phasen-Verteilung" (`role="tablist"`), i18n in allen fünf Dictionaries.

**Eigene Vokabeln:** Button öffnet Inline-Formular (deutsches Wort + Übersetzung). Speicherung in `localStorage` über `lib/vocabulary-custom.ts` (Key `sitov_custom_vocab:{level}:{lesson}`), Start immer Phase 1. Führendes `der`/`die`/`das` wird für Artikelfarben geparst. Erscheinen sofort in Liste und Diagramm; bewusst **kein** Server-Write in `vocabulary_cards` / `user_vocabulary_progress` (kein Fälligkeits-Mechanismus, gerätegebunden).

**Phasen-Diagramm:** Tailwind-Balken für Phase 1–6 und „Gelernt", Anzahl über dem Balken, farbliche Phasenbezeichnung darunter (Amber → Grün), Gesamtfortschritt gewichtet (unberührt = 0, Phase n = n/7, gelernt = 7/7). `computePhaseDistribution` in `lib/vocabulary-ui.ts`, Tests in `__tests__/vocabulary-phases.test.ts` und `__tests__/vocabulary-custom.test.ts`.

**Qualitätssicherung:** `npx tsc --noEmit` fehlerfrei, neue Unit-Tests grün. Live-Klick im Browser nicht möglich (kein laufender Dev-Server, keine Browser-Tools in dieser Session).

## 4h. Globale UI-Fixes: Padding, keine Silbentrennung, Niveau-Farbcodierung (2026-09-06)

- **Keine automatische Silbentrennung mehr:** Die globale `p`-Regel in `app/globals.css` nutzte `text-justify hyphens-auto` und trennte Wörter an unnatürlichen Stellen (für die ältere Zielgruppe irritierend). Neu: `text-left` + `hyphens: none` (inkl. `-webkit-`/`-ms-`-Präfix) und `overflow-wrap: break-word`. Blocksatz entfernt, damit ohne Silbentrennung keine hässlichen Wortlücken (Rivers) entstehen. Keine weiteren `hyphens-auto`/`text-justify`-Vorkommen im Projekt.
- **Mehr Padding auf Hinweis-/Card-Containern:** Der Empty-State „Für dieses Sprachniveau gibt es noch keine Lernsets…" (`app/[lang]/dashboard/level/[level]/vocabulary/page.tsx`) hatte nur vertikales `py-12` ohne Seitenabstand – Text klebte am Rand. Jetzt `p-8 sm:p-12` (+ `break-words`). Äußerer Übersichts-Container von `p-5` auf `p-6 sm:p-10` erhöht. Trainer-Kartenflächen (`VocabTrainerClient.tsx`) von `p-5` auf `p-6` (Vorder-/Rückseite, Aufdeck-Bereich, Feedback-Box).
- **Niveau-Farbcodierung statt Abdunklung:** Bisher wurden die Icon-Verläufe der Niveaus (`app/[lang]/dashboard/page.tsx`) mit steigendem Level immer dunkler (`#FF5C00` → `#993500`), was wie ein deaktivierter/ausgegrauter Zustand wirkte. Neu: Helper `levelVisual(levelId)` in `lib/vocabulary-ui.ts` liefert pro CEFR-Stufe eine eigene Farbwelt (A1 Smaragd/Türkis, A2 Himmelblau, B1 Marken-Orange, B2 Rosé/Pink, C1 Violett, C2 Gold) mit `gradient`/`bar`/`soft`/`text`-Klassen inkl. Dark-Mode. Die Riesen-Hintergrundzahl wurde durch ein klar lesbares, farbcodiertes Niveau-Badge ersetzt.
- **Tailwind-Content erweitert:** `tailwind.config.ts` scannt nun auch `./lib/**`, damit die statischen Farbklassen aus `levelVisual`/`phaseBarClasses` zuverlässig generiert werden.
- **Qualitätssicherung:** `npx tsc --noEmit` fehlerfrei. Kein `any`, keine neuen Server Actions/DB-Änderungen.

## 4i. Vokabeltrainer: Sofortiger Kartenwechsel & Tinder-Pre-Rendering (2026-09-06)

- **Feedback-Meldungen entfernt:** Nach „Wusste ich" / „Wusste ich nicht" erscheint keine Bestätigungsmeldung mehr (früher „Weiter in Phase X. Wiederholung schon morgen." + separater „Nächste Karte"-Button). Der Wechsel erfolgt sofort. `AnswerFeedback`-State, `handleNext` und der Zwischen-Button wurden aus `VocabTrainerClient.tsx` entfernt.
- **Fire-and-forget-Speicherung:** `submitVocabularyAnswer` läuft im Hintergrund; der Kartenwechsel wartet bewusst nicht auf die Server-Antwort. Schlägt das Speichern fehl, erscheint weiterhin der dezente, nicht-blockierende `save_failed`-Hinweis (Graceful Degradation).
- **Tinder-Pre-Rendering:** Aktuelle Karte (Index `i`) und Folgekarte (`i+1`) liegen per CSS-Grid (`[grid-area:1/1]`) übereinander im DOM. Die Folgekarte ist inkl. Bild fertig gerendert; zusätzlich werden die Bilder von `i+1` und `i+2` per `new Image()` vorgeladen. Beim Antworten fliegt die aktive Karte weich zur Seite (rechts = gewusst, links = nicht gewusst; `translate`+`rotate`+`opacity`, 260 ms), die dahinterliegende Karte wird ohne Ladezeit sofort aktiv. `motion-reduce:transition-none` respektiert Bewegungsreduktion.
- **Qualitätssicherung:** `npx tsc --noEmit` fehlerfrei, keine Lint-Fehler, kein `any`, keine DB-/Server-Action-Änderungen.

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
