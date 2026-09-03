# Architecture Masterplan

## 1. Datenmodellierung (Datenbankschema)

**Supabase-Projekt:** `wcaslabeiwtvygxtzcio` (Sitov Academy v2) — Live-Datenbank, produktiv im Einsatz.

**Schema-Referenz:** `supabase/schema.sql` (Tabellen, Funktionen, Trigger, RLS-Policies, Indizes)  
**TypeScript-Types:** `supabase/database.types.ts` (automatisch generiert via Supabase MCP/CLI)

Das Supabase-Schema muss für eine klare Trennung von Identität (`auth.users`), Profil-Daten und Geschäftslogik sorgen.

### Kern-Entitäten
- **Profiles (`profiles`)**: Erweiterung von `auth.users`.
  - `role`: `student` | `teacher` (für RBAC)
  - `subscription_status`: `kostenlos` | `aktiv` | `pausiert`
  - `stripe_customer_id`, `stripe_subscription_id`
  - `native_language` (für i18n Hints)
- **Courses (`courses`) & Lektionen (`lessons`)**: 
  - Kurse (A1.1 bis C2) mit Typ (`presence` | `online`), Preis, Instructor.
  - *Zusätzlich benötigt*: Eine hierarchische `lessons`-Tabelle (gehört zu Kurs), um Videos, Vokabeln und Übungen sauber zu bündeln.
- **Content-Entitäten**:
  - `videos`: URL, Lektions-Zugehörigkeit, Titel.
  - `vocabulary_cards`: Wort, Artikel, Plural, Übersetzungen (`translation_ru` / `_tr` / `_en`), Audio, Bild. Lernsets sind der Text in `lesson` plus `level`. A1.1 live: **Lektion 1** (84 Karten), **Lektion 2** (85 Karten), **Lektion 3** (76 Karten). Seed: `supabase/seeds/a11_*.sql`. Migration: `supabase/migrations/move_einkauf_vocab_to_a11_lektion_3.sql`.
  - `exercises`: Typ (`fill_in_blank`, `multiple_choice`, `sentence_building`), Content als JSONB, `solution_audio_url` für Tap-to-Listen.
    - `content` bei `fill_in_blank`: `{ text_before, text_after, correct_answer, options?, smart_hint? }`.
      `options` sind die Auswahl-Chips; fehlen sie, werden sie serverseitig aus der Wortfamilie generiert.
- **Progress & User Data**:
  - `user_vocabulary_progress`: Phase-6-Leitner (`box_number` 1–6 = aktive Lernphasen, 7 = dauerhaft gelernt), `next_review_date`, `lapses` (Anzahl der Rückstufungen), `last_answered_at`.
    - Ruhezeiten je Phase: 1, 1, 3, 9, 29, 90 Tage; für kontrastiv schwere Vokabeln halbiert (min. 1 Tag).
    - Die Phasenlogik liegt ausschließlich in `lib/leitner.ts` als reine Funktionen – Server Actions und UI enthalten keine Intervall-Arithmetik.
    - Index `idx_user_vocabulary_progress_due` auf `(user_id, next_review_date, box_number)` für die Abfrage der fälligen Karten.
    - **Übernahme-Wege in den Karteikasten:** (1) automatisch beim Sofort-Start einer ganzen Lektion (`initializeLesson`, legacy), (2) manuell je Einzelvokabel über `addCardsToTrainer(cardIds)` (Start immer Phase 1), (3) über den „Vokabeln einstufen"-Durchlauf `submitLessonAssessment(decisions)` – bekannte Vokabeln landen direkt auf Box 7 mit regulärer Phase-6-Ruhezeit, neue starten in Phase 1. Alle drei Wege überspringen Karten mit bereits bestehendem Lernstand (kein Überschreiben von Fortschritt).
    - `getLessonCards(lesson, level)` liefert alle Vokabeln einer Lektion inklusive persönlichem Lernstand (`phase: null` = noch nicht übernommen) für die Lektions-Detailansicht. `components/vocabulary/LessonList.tsx` zeigt je Lektion nur noch Kennzahlen + Buttons; die eigentliche Vokabelliste öffnet als `components/vocabulary/LessonCardsModal.tsx` (Overlay, `max-h-[400px] overflow-y-auto`) statt als Inline-Akkordeon – ein aufklappender Bereich hätte die Übersichtsseite bei vielen Vokabeln endlos lang gezogen und das No-Scroll-Viewport-Layout (Punkt 4) verhindert.
  - `user_exercise_progress`: Score (0–100, gestaffelt nach Versuchen), Completed-Status, `attempts`, `hint_shown`.
  - `submissions` & `teacher_feedback`: Audio/Text-Einsendungen von Studenten, verknüpft mit Lehrer-Feedback (Audio/Text).
    - `submissions.parent_id` / `attempt_number` bilden die Kette aus erstem Versuch und Wiedervorlage.
    - `teacher_feedback.seen_at`: NULL = der Schüler hat die Rückmeldung noch nicht geöffnet. Speist die Dashboard-Karte „Du hast eine neue Sprachnachricht erhalten".
    - Gesetzt wird `seen_at` ausschließlich über die SECURITY-DEFINER-Funktion `mark_feedback_seen(uuid)`. Der Schüler erhält bewusst keine UPDATE-Policy auf `teacher_feedback`, damit der Feedback-Text für ihn unveränderlich bleibt.
    - Die Funktion läuft mit `search_path = ''` (alle Objekte vollqualifiziert) und `EXECUTE` liegt nur bei `authenticated`; `anon` ist explizit entzogen, damit der RPC-Endpunkt nicht ohne Anmeldung erreichbar ist.
- **Audio-Pipeline**:
  - Aufnahme: `lib/audio/useAudioRecorder.ts` (getUserMedia, MediaRecorder, AnalyserNode) – einzige Quelle für Schüler- und Lehrer-Aufnahmen. Gibt zusätzlich `analyserRef` (Live-`AnalyserNode`) nach außen frei, damit Visualisierungen direkt auf Rohdaten zugreifen können.
  - Darstellung: `lib/audio/waveform.ts` (reine Funktionen, inkl. `smoothTowards()` für Frame-Glättung) plus die wiederverwendbare Canvas-Komponente `components/audio/FluidWaveform.tsx` – eine Siri-artige, aus drei phasenverschobenen Sinuswellen bestehende Tonspur, datenquellen-agnostisch über eine `getVolume(): number`-Prop (0–1 je Frame). Zwei Verwender:
    - `LiveWaveform` (laufende Aufnahme): liefert den echten Mikrofon-Pegel aus dem `AnalyserNode`, Fallback auf das `levels`-Array.
    - `WaveformPlayer` (Wiedergabe, ersetzt die frühere Balken-Anzeige vollständig): simuliert den Pegel während `isPlaying` bewusst über zwei sanft verstimmte, überlagerte Sinuswellen statt über einen echten `AnalyserNode` am `<audio>`-Element – das würde die Wiedergabe über `createMediaElementSource()` in den Web-Audio-Graphen umleiten (Stummschaltungsrisiko, nur eine Quelle pro Element über alle Re-Renders, CORS-Abhängigkeit vom Storage-Bucket) und ist für die Kernfunktion "Aufnahme anhören" zu riskant. Seek-Interaktion (`role="slider"`, Klick, Pfeiltasten) bleibt erhalten, nur die Balken-Darstellung wurde ersetzt; eine schmale Fortschritts-Leiste unter der Welle zeigt weiterhin die abgespielte Position.
    - `FluidWaveform` animiert nur, während `isActive` true ist (rAF-Loop); im inaktiven Zustand wird ein einzelner ruhiger Frame gezeichnet statt einer Dauerschleife – wichtig, wenn mehrere Player gleichzeitig auf einer Seite stehen (`SubmissionHistory`).
  - Upload: `lib/audio/upload.ts`, Bucket `audio_submissions`. Pfade `{userId}-{timestamp}` (Schüler) und `feedback/{submissionId}_{timestamp}` (Lehrkraft) – von den Storage-Policies abhängig, daher nicht ändern. `contentType` wird über `baseMimeType()` auf den reinen Basistyp (`audio/webm` / `audio/mp4`, ohne `;codecs=...`) reduziert, bevor er an Storage gesendet wird; `upload()` läuft mit `upsert: true`. Storage-Fehler (Bucket/Pfad/MIME/Statuscode) und Netzwerkfehler werden vollständig über `console.error` geloggt (nie nur eine generische Meldung). RLS: `supabase/migrations/fix_audio_submissions_storage_policies.sql` (idempotent, INSERT/UPDATE für `authenticated`, SELECT für `public`).
  - Browser-Client: `utils/supabase/client.ts` liest `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` bewusst **direkt und literal** aus `process.env` (nicht über `lib/supabase-env.ts`), da Next.js diese Variablen nur bei wortwörtlichem `process.env.NEXT_PUBLIC_*`-Zugriff zur Build-Zeit ins Client-Bundle einbrennt. Fehlen die Variablen, wirft `createClient()` einen typisierten `SupabaseConfigError` (mit vorherigem `console.error`) statt mit leeren Strings in `@supabase/ssr` zu crashen; `lib/audio/upload.ts` fängt diesen Fehler gezielt ab (`reason: 'not_configured'`). `lib/supabase-env.ts` bleibt ausschließlich für serverseitigen Code (Server Components, Server Actions, Middleware, Admin-Client) reserviert.

## 2. API-Design & Routing (Next.js App Router)

### Ordner-Struktur (Routing)
```
app/[lang]/
  ├── (public)/          # Landing Pages, Preise, AGB, Impressum
  ├── (auth)/            # /login, /register, /reset-password
  ├── (student)/
  │   └── dashboard/     # Premium-Inhalte, Vokabeltrainer, Übungen, Video-Player
  └── (admin)/
      └── teacher/       # CMS, User-Verwaltung, Submission-Feedback
```

### Server Actions (API-Ersatz)
Statt traditioneller `/api`-Routen werden React Server Actions in `actions/` verwendet, um Type-Safety (Zero-Error-Policy) zu garantieren:
- `actions/auth.ts`: Login/Logout/Register.
- `actions/vocabulary.ts`: `getDueCards`, `submitVocabularyAnswer`, `getLessonStats`, `getLessonCards` (Detailansicht), `addCardsToTrainer` (manuelle Einzelübernahme), `submitLessonAssessment` (Pre-Assessment-Einstufung). Route `/dashboard/level/[level]/vocabulary/assess?lesson=…` nutzt `getLessonCards` + `submitLessonAssessment` für den „Vokabeln einstufen"-Durchlauf.
- `actions/student.ts`: Submit Exercise, Update Vocab Box, Upload Audio Submission.
- `actions/teacher.ts`: Provide Feedback, Update User Subscription (manuell).
- `actions/stripe.ts`: Create Checkout Session, Customer Portal.

## 3. Sicherheitskonzept & RBAC (Role-Based Access Control)

### Edge Middleware (`middleware.ts`)
1. **Session Check**: Überprüft bei jeder Anfrage den JWT-Token und übernimmt gesetzte Cookies bei Weiterleitungen.
2. **Auth-Callbacks**: `/auth/*` ist von Locale- und `?lang=`-Redirects ausgenommen (`lib/locale-routing.ts`). Bestätigungslinks (`/auth/confirm?lang=de&token_hash=…`) dürfen niemals auf `/de` umgeschrieben werden – sonst geht das Einmal-Token verloren.
3. **Routenschutz**: `/dashboard`, `/premium` und `/admin` verlangen eine Sitzung. `/login` und `/register` leiten eingeloggte Nutzer ins Dashboard.
4. **Lehrer-UI**: Die eigentliche Rollenprüfung (`teacher` | `admin`) bleibt im `app/[lang]/admin/layout.tsx`. Die Middleware fängt nur unangemeldete Aufrufe ab.

### Authentifizierung (produktionsreif)
- **Kanonische Domain:** `https://www.sitov-academy.com` (`CANONICAL_SITE_URL` in `lib/site-url.ts`).
- **Outbound-URLs:** `getOutboundSiteUrl()` erzeugt Bestätigungs-, Reset- und Feedback-Links. Localhost wird übersprungen, selbst wenn die Registrierung lokal gegen die Live-DB läuft.
- **Callback:** `app/auth/confirm/route.ts` und `app/auth/callback/route.ts` akzeptieren PKCE (`?code=`) und OTP (`?token_hash=` / `?token=` + `type=`). Token-Hash hat Vorrang (geräteunabhängig). Nach Erfolg geht es über `NEXT_PUBLIC_SITE_URL` direkt auf `/{lang}/dashboard` (Recovery: `/{lang}/reset-password`).
- **Site-URL:** Auth- und Stripe-Weiterleitungen nutzen `getSiteUrl()` / `buildPublicUrl()` aus `lib/site-url.ts`. Es gibt keine hartcodierte `http://localhost:3000`-Redirects in Auth- oder API-Routern.
- **Supabase-Env:** `lib/supabase-env.ts` liest `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` und fällt auf die Aliase `SUPABASE_URL` / `SUPABASE_ANON_KEY` zurück.
- **Supabase Auth (kein SQL, GoTrue-Config):** Site URL = `https://www.sitov-academy.com`. Redirect-Allowlist: `https://www.sitov-academy.com/**`, `https://sitov-academy.com/**`, `https://www.sitov-academy.com/auth/confirm**`, `https://www.sitov-academy.com/auth/callback**`, `http://localhost:3000/**`.
- **E-Mail-Templates:** `supabase/templates/confirmation.html` und `recovery.html` nutzen `token_hash` plus `RedirectTo` (Fallback: `SiteURL`). So funktioniert der Link auch in einem anderen Browser, und die Sprache aus der Registrierung bleibt erhalten.

### Row Level Security (RLS) in Supabase
- **Profiles**: Jeder Nutzer kann nur sein eigenes Profil lesen/schreiben. Lehrer können alle lesen.
- **Submissions**: Studenten lesen/schreiben eigene. Lehrer lesen alle und schreiben Feedback.
- **Teacher Feedback**: Lehrer schreiben und lesen alles, Studenten lesen nur Feedback zu eigenen Einreichungen. Studenten haben keine UPDATE-Rechte; der Gelesen-Status läuft über `mark_feedback_seen(uuid)`.
- **Content (Videos, Exercises)**: Public (oder Authenticated) Read-Only. Schreibrechte nur für Lehrer.

### Serverseitige Automatisierung (Live)
- **`handle_new_user`**: Trigger auf `auth.users` → erstellt automatisch `profiles`-Eintrag.
- **`handle_registration_confirmation`**: Trigger auf `registrations.status` → erstellt `enrollments` bei Bestätigung.
- **`notify-registration-insert` / `notify-trial-insert`**: HTTP-Trigger → Edge Function `notify-new-enrollment`.

## 4. UX/UI-Architektur (Geragogik & Barrierefreiheit)

- **Smartphone zuerst:** Cursor-Agent `.cursor/rules/ux-smartphone-agent.mdc` (Mobile-First, 375px, kein Horizontal-Scroll, Safe-Area). Geragogik-Maße bleiben in `ux-geragogik-agent.mdc`.
- **Lernplattform-Hülle:** `app/[lang]/dashboard/layout.tsx` nutzt einen `flex flex-wrap justify-between`-Header: Logo per `order-1` ganz links, Profil/Theme/Abmelden per `order-2`/`order-3` (`md:order-3`) ganz rechts, Breadcrumb-Navigation (`DashboardHeader`) per `order-3 basis-full` (`md:order-2 md:basis-auto`) – auf dem Handy eigene volle Zeile unterhalb, ab `md:` mittig zwischen Logo und Profil-Block. Nur noch eine `DashboardHeader`-Instanz (keine Duplizierung mehr); Breakpoint innerhalb der Komponente ist konsistent `md:`. Touch-Targets 48px, `min-h-dvh`, Safe-Area, Profil-Icon. Texte über `lib/dashboard-i18n.ts` / `lib/videos-i18n.ts` / `lib/profile-i18n.ts`.
- **Komponenten-Design (Mobile First)**: 
  - Extrem aufgeräumt, große Buttons (min. 48x48px Touch-Target).
  - Primäraktionen auf dem Handy volle Breite, Toolbars stapeln unter `md:`.
- **Feedback & Fehler-Toleranz (Zero-Error UI)**:
  - Bei Netzwerkfehlern (z.B. Offline) greift Next.js `error.tsx` mit einem freundlichen Fallback ("Hoppla, das Internet hakt. Versuchen Sie es noch einmal.").
  - Skeleton-Loader für *jeden* asynchronen Ladevorgang (`loading.tsx` und Suspense-Boundaries), um das Gefühl von fließender Geschwindigkeit zu erzeugen.
  - Keine "leeren" Seiten. Wenn keine Vokabeln fällig sind: Wunderschöne Illustration mit Lob ("Alles gelernt für heute!").
- **Styling**: Sitov Branding (`#FF5C00`), weiche Slate-Töne für Dark/Light-Mode. Keine grellen Kontraste, die die Augen älterer Nutzer anstrengen, aber klare Hervorhebungen für Call-to-Actions.
- **No-Scroll-Viewport-Layout (Desktop, `lg:`)**: Die Hauptansichten der vier Trainer (`vocabulary`, `vocabulary/train`, `vocabulary/assess`, `pronunciation`, `exercises`, `videos`) nutzen ab `lg:` das Muster `lg:h-[calc(100vh-5rem)] lg:overflow-hidden` auf dem äußeren Container plus `flex flex-col`: ein fixer Kopfbereich (`shrink-0`, Zurück-Link, Titel, Hero/Recorder) und darunter genau ein scrollbarer Bereich (`min-h-0 flex-1 lg:overflow-y-auto`), der die eigentliche Liste/Karte enthält. So scrollt auf Desktop nie die ganze Seite, nur der jeweilige Inhaltsbereich – auf Mobile (`< lg`) bleibt gewohntes vertikales Scrollen, da die Höhenbegrenzung nur ab `lg:` greift.

## Re-Branding "Sitov Academy" (2026-09-03)
Alle Textvorkommen von "SmartGerman" (Komponenten, i18n-Fallbacks, Alt-Texte, Doku, Kommentare in `.mdc`/`.sql`) wurden durch "Sitov Academy" ersetzt. Unverändert: `package.json`-Name (bereits `sitov-language-academy`), Supabase-Projekt-ID `wcaslabeiwtvygxtzcio`, sowie externe URLs/Handles wie `t.me/smartgerman_hannover` (echter Telegram-Kanalname, keine Umbenennung möglich).

## 5. Übungs-Modul (Lückentexte & Multiple Choice)

### Eingabe-Paradigma
Es gibt **keine freie Tastatureingabe**. Jede Lücke wird über Tipp-Chips (Tap-to-Select)
gelöst — kein Drag-and-Drop, keine Tippfehler auf Mobilgeräten.

### Bausteine
| Datei | Aufgabe |
|---|---|
| `lib/types/exercise.ts` | Diskriminierte Union der Übungstypen, Parser von JSONB → Typ, CMS-Payload |
| `lib/exercise-chips.ts` | Chip-Generator (Wortfamilien, deterministische Reihenfolge), Smart-Hint-Logik, Punktestaffelung |
| `lib/exercise-i18n.ts` | Zentrale Textbausteine + Platzhalter-Interpolation (`{letter}`, `{length}`) |
| `app/actions/exercises.ts` | `getExercises`, `recordExerciseAttempt`, `finishExerciseSession` |
| `components/exercises/FillInBlankExercise.tsx` | Lückentext mit Chips, Smart Hints, Audio |
| `components/exercises/MultipleChoiceExercise.tsx` | Multiple Choice im gleichen Zero-Error-Muster |
| `components/exercises/SolutionAudioButton.tsx` | Tap-to-Listen mit Fallback-Kette |
| `components/exercises/SmartHintPanel.tsx` | Darstellung des strukturierten Hinweises |

### Zero-Error-Ablauf
1. Chip antippen → Lücke füllt sich (Auswahl bleibt änderbar).
2. „Antwort prüfen" → falsch getippte Chips werden ausgegraut, die Aufgabe bleibt offen.
3. Ab **2 Fehlversuchen**: Smart Hint (Genus bzw. Wortart). Ab **3 Fehlversuchen**: Anfangsbuchstabe und Wortlänge.
4. Gelöst → Tap-Buttons für die Aussprache des Wortes und des ganzen Satzes.

Es gibt keine Timer, keine Bestenlisten und keine Fehler-Metaphorik (kein Rot, kein X).

### Smart-Hint-Quellen (Priorität)
1. `content.smart_hint` aus dem CMS
2. Genus aus `vocabulary_cards.article` (nur wenn die Lücke selbst kein Artikel ist — sonst wäre die Lösung verraten)
3. Wortart-Heuristik aus den Wortfamilien
4. Anfangsbuchstabe + Wortlänge

### Audio-Fallback-Kette
`exercises.solution_audio_url` → `vocabulary_cards.audio_url` → Web-Speech-API (`de-DE`, Rate 0.9) → Hinweistext.

### Fortschritts-Persistenz
`recordExerciseAttempt` schreibt jeden Versuch fort und ruft **kein** `revalidatePath` auf — ein
Refresh mitten im Durchlauf würde die Übungsliste neu filtern und die Indizes verschieben.
Die Fortschrittsanzeigen werden erst über `finishExerciseSession` am Ende des Durchlaufs aktualisiert.
