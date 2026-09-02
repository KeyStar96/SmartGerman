# Architecture Masterplan

## 1. Datenmodellierung (Datenbankschema)

**Supabase-Projekt:** `wcaslabeiwtvygxtzcio` (SmartGerman v2) — Live-Datenbank, produktiv im Einsatz.

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
  - `vocabulary_cards`: Wort, Artikel, Plural, Übersetzungen (`translation_ru` / `_tr` / `_en`), Audio, Bild. Lernsets sind der Text in `lesson` plus `level`. A1.1 live: **Lektion 1** (84 Karten), **Lektion 2** (161 Karten). Seed: `supabase/seeds/a11_*.sql`.
  - `exercises`: Typ (`fill_in_blank`, `multiple_choice`, `sentence_building`), Content als JSONB, `solution_audio_url` für Tap-to-Listen.
    - `content` bei `fill_in_blank`: `{ text_before, text_after, correct_answer, options?, smart_hint? }`.
      `options` sind die Auswahl-Chips; fehlen sie, werden sie serverseitig aus der Wortfamilie generiert.
- **Progress & User Data**:
  - `user_vocabulary_progress`: Phase-6-Leitner (`box_number` 1–6 = aktive Lernphasen, 7 = dauerhaft gelernt), `next_review_date`, `lapses` (Anzahl der Rückstufungen), `last_answered_at`.
    - Ruhezeiten je Phase: 1, 1, 3, 9, 29, 90 Tage; für kontrastiv schwere Vokabeln halbiert (min. 1 Tag).
    - Die Phasenlogik liegt ausschließlich in `lib/leitner.ts` als reine Funktionen – Server Actions und UI enthalten keine Intervall-Arithmetik.
    - Index `idx_user_vocabulary_progress_due` auf `(user_id, next_review_date, box_number)` für die Abfrage der fälligen Karten.
  - `user_exercise_progress`: Score (0–100, gestaffelt nach Versuchen), Completed-Status, `attempts`, `hint_shown`.
  - `submissions` & `teacher_feedback`: Audio/Text-Einsendungen von Studenten, verknüpft mit Lehrer-Feedback (Audio/Text).
    - `submissions.parent_id` / `attempt_number` bilden die Kette aus erstem Versuch und Wiedervorlage.
    - `teacher_feedback.seen_at`: NULL = der Schüler hat die Rückmeldung noch nicht geöffnet. Speist die Dashboard-Karte „Du hast eine neue Sprachnachricht erhalten".
    - Gesetzt wird `seen_at` ausschließlich über die SECURITY-DEFINER-Funktion `mark_feedback_seen(uuid)`. Der Schüler erhält bewusst keine UPDATE-Policy auf `teacher_feedback`, damit der Feedback-Text für ihn unveränderlich bleibt.
    - Die Funktion läuft mit `search_path = ''` (alle Objekte vollqualifiziert) und `EXECUTE` liegt nur bei `authenticated`; `anon` ist explizit entzogen, damit der RPC-Endpunkt nicht ohne Anmeldung erreichbar ist.
- **Audio-Pipeline**:
  - Aufnahme: `lib/audio/useAudioRecorder.ts` (getUserMedia, MediaRecorder, AnalyserNode) – einzige Quelle für Schüler- und Lehrer-Aufnahmen.
  - Darstellung: `lib/audio/waveform.ts` (reine Funktionen) plus `LiveWaveform` (laufende Aufnahme) und `WaveformPlayer` (fertige Datei mit Fortschritt, Tempo und Sprung).
  - Upload: `lib/audio/upload.ts`, Bucket `audio_submissions`. Pfade `{userId}-{timestamp}` (Schüler) und `feedback/{submissionId}_{timestamp}` (Lehrkraft) – von den Storage-Policies abhängig, daher nicht ändern.

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
- **Lernplattform-Hülle:** `app/[lang]/dashboard/layout.tsx` stapelt auf dem Handy Logo/Aktionen und darunter den Seitentitel (`DashboardHeader`). Touch-Targets 48px, `min-h-dvh`, Safe-Area, Profil-Icon. Texte über `lib/dashboard-i18n.ts` / `lib/videos-i18n.ts` / `lib/profile-i18n.ts`.
- **Komponenten-Design (Mobile First)**: 
  - Extrem aufgeräumt, große Buttons (min. 48x48px Touch-Target).
  - Primäraktionen auf dem Handy volle Breite, Toolbars stapeln unter `md:`.
- **Feedback & Fehler-Toleranz (Zero-Error UI)**:
  - Bei Netzwerkfehlern (z.B. Offline) greift Next.js `error.tsx` mit einem freundlichen Fallback ("Hoppla, das Internet hakt. Versuchen Sie es noch einmal.").
  - Skeleton-Loader für *jeden* asynchronen Ladevorgang (`loading.tsx` und Suspense-Boundaries), um das Gefühl von fließender Geschwindigkeit zu erzeugen.
  - Keine "leeren" Seiten. Wenn keine Vokabeln fällig sind: Wunderschöne Illustration mit Lob ("Alles gelernt für heute!").
- **Styling**: Sitov Branding (`#FF5C00`), weiche Slate-Töne für Dark/Light-Mode. Keine grellen Kontraste, die die Augen älterer Nutzer anstrengen, aber klare Hervorhebungen für Call-to-Actions.

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
